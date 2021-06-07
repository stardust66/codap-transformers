import { DataSet } from "../transformations/types";
import { DataContext } from "../utils/codapPhone/types";
import {
  createTableWithDataSet,
  updateContextWithDataSet,
  addContextUpdateListener,
} from "../utils/codapPhone";

/**
 * This function takes a dataset as well as a `doUpdate` flag and either
 * creates a new table for the dataset or updates an existing one accordingly.
 *
 * @returns The name of the newly created context.
 */
export async function applyNewDataSet(
  dataSet: DataSet,
  name: string | undefined
): Promise<string> {
  // if doUpdate is true then we should update a previously created table
  // rather than creating a new one
  const [newContext] = await createTableWithDataSet(dataSet, name);
  return newContext.name;
}

/**
 * Returns the context's title, if any, or falls back to its name.
 */
export function ctxtTitle(context: DataContext): string {
  return context.title ? context.title : context.name;
}

/**
 * Set up a listener to update `outputContext` when `inputContext` changes.
 *
 * @param inputContext - The input context
 * @param outputContext - The context to update
 * @param doTransform - A transformation function that returns the result
 * dataset
 * @param setErrMsg - A function that displays the error message to the user
 */
export function addUpdateListener(
  inputContext: string,
  outputContext: string,
  doTransform: () => Promise<[DataSet, string]>,
  setErrMsg: (msg: string | null) => void
): void {
  addContextUpdateListener(inputContext, async () => {
    setErrMsg(null);
    try {
      const [transformed] = await doTransform();
      updateContextWithDataSet(outputContext, transformed);
    } catch (e) {
      setErrMsg(`Error updating ${outputContext}: ${e.message}`);
    }
  });
}
