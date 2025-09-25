export interface ProjectPreferenceSchema {
    [name: string]: Object,
    properties: {
        [name: string]: object
    }
}

export interface PreferenceContribution {
    readonly schema: ProjectPreferenceSchema;
}

export const projectPreferenceSchema: ProjectPreferenceSchema = {
    "type": "object",
    "properties": {
        "project.favorites": {
            "description": "List of paths of favorite projects",
            "type": "array",
            "default": [],
            "items": {
                "type": "string"
            },
        }
    }
};