import { cloneValue } from "@metad/core";
import { IValueHelpResourceStrings, ValueHelpResourceStringsEN } from "./value-help-resources";

export interface IResourceStrings extends IValueHelpResourceStrings { }

export const CurrentResourceStrings = {
    ValueHelpResourceStrings: cloneValue(ValueHelpResourceStringsEN),
};

const updateResourceStrings = (currentStrings: IResourceStrings, newStrings: IResourceStrings) => {
    for (const key of Object.keys(newStrings)) {
        if (key in currentStrings) {
            currentStrings[key] = newStrings[key];
        }
    }
};

/**
 * Changes the resource strings for all components in the application
 * ```
 * @param resourceStrings to be applied
 */
export const changei18n = (resourceStrings: IResourceStrings) => {
    for (const key of Object.keys(CurrentResourceStrings)) {
        updateResourceStrings(CurrentResourceStrings[key], resourceStrings);
    }
};

/**
 * Returns current resource strings for all components
 */
export const getCurrentResourceStrings = (): IResourceStrings => ({
    ...CurrentResourceStrings.ValueHelpResourceStrings,
});
