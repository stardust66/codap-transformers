import { DataSet, DataSetCase } from "./types";
import { reparent, eraseFormulas } from "./util";

/**
 * Constructs a dataset with only the indicated attributes from the
 * input dataset included, and all others removed.
 *
 * @param dataset the dataset to transform
 * @param attributes either the attributes to include or exclude from
 *  the output dataset, depending on allBut
 * @param allBut should "all but" the given attributes be selected,
 *  or only the given attributes
 */
export function selectAttributes(
  dataset: DataSet,
  attributes: string[],
  allBut: boolean
): DataSet {
  // determine which attributes are being selected
  const selectedAttrs = attrsToSelect(dataset, attributes, allBut);

  if (selectedAttrs.length === 0) {
    throw new Error(
      `Transformed dataset must contain at least one attribute (0 selected)`
    );
  }

  // copy records, but only the selected attributes
  const records = [];
  for (const record of dataset.records) {
    const copy: DataSetCase = { values: {} };
    for (const attrName of selectedAttrs) {
      // attribute does not appear on record, error
      if (record.values[attrName] === undefined) {
        throw new Error(`Invalid attribute name: ${attrName}`);
      }

      copy.values[attrName] = record.values[attrName];
    }
    records.push(copy);
  }

  // copy collections
  const allCollections = dataset.collections.slice();
  const collections = [];

  // filter out any attributes that aren't in the selected list
  for (const coll of allCollections) {
    coll.attrs = coll.attrs?.filter((attr) =>
      selectedAttrs.includes(attr.name)
    );

    // do not copy formulas: selected attributes may be separated from
    // their formula's dependencies, rendering the formula invalid.
    if (coll.attrs !== undefined) {
      eraseFormulas(coll.attrs);
    }

    // keep only collections that have at least one attribute
    if (coll.attrs === undefined || coll.attrs.length > 0) {
      collections.push(coll);
    } else {
      reparent(allCollections, coll);
    }
  }

  return {
    collections,
    records,
  };
}

/**
 * Returns list of attributes that should be included in the selected
 * output. If allBut is set, all attributes in the context that are
 * not in the given list will be included. If it is not, the
 * given list of attributes is returned.
 */
function attrsToSelect(
  dataset: DataSet,
  attributes: string[],
  allBut: boolean
): string[] {
  // the given attributes are being selected
  if (!allBut) {
    return attributes;
  }

  let selected: string[] = [];

  for (const coll of dataset.collections) {
    // find all attributes within this collection that are
    // NOT in the given attribute list
    const attrs = coll.attrs
      ?.map((attr) => attr.name)
      ?.filter((name) => !attributes.includes(name));

    if (attrs !== undefined) {
      selected = selected.concat(attrs);
    }
  }

  return selected;
}
