/* See https://jsonforms.io for more information on how to configure data and ui schemas. */

import { JsonSchema7 } from "@jsonforms/core";

export const projectSchema: JsonSchema7 = {
    definitions: {
        project: {
            title: 'Project',
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                },
                typeId: {
                    const: 'ProjectModel'
                },
                name: {
                    type: 'string',
                    readOnly: true,
                    minLength: 3,
                    maxLength: 20
                },
                isFavorite: {
                    type: 'boolean'
                },
                systemModel: {
                    $ref: '#/definitions/systemModel'
                },
                lowLevelDesignes: {
                    type: "array",
                    items: {
                        $ref: '#/definitions/lowLevelDesign'
                    },
                },
            },
            required: ['name'],
        },
    }
};

export const systemModelSchema: JsonSchema7 = {
    definitions: {
        systemModel: {
            title: 'System Model',
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                },
                typeId: {
                    const: 'SystemModel'
                },
                name: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20
                }
            },
        },
    }
}

export const lowLevelDesignModelSchema: JsonSchema7 = {
    definitions: {
        lowLevelDesign: {
            title: 'Low Level Design',
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                },
                typeId: {
                    const: 'LowLevelDesignModel'
                },
                name: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20
                },
                rtlModel: {
                    $ref: '#/definitions/rtlModel'
                },
                fpgaModels: {
                    type: "array",
                    items: {
                        $ref: '#/definitions/fpgaModel'
                    },
                }
            },
        },
    }
}

export const rtlModelSchema: JsonSchema7 = {
    definitions: {
        rtlModel: {
            title: 'RTL Model',
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                },
                typeId: {
                    const: 'RTLModel'
                },
                name: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20
                }
            },
        },
    }
}

export const fpgaModelSchema: JsonSchema7 = {
    definitions: {
        fpgaModel: {
            title: 'FPGA Topology Model',
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                },
                typeId: {
                    const: 'FPGAModel'
                },
                name: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20
                }
            },
        },
    }
}

export const vlsiModelSchema: JsonSchema7 = {
    definitions: {
        vlsiModel: {
            title: 'VLSI Topology Model',
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                },
                typeId: {
                    const: 'VLSIModel'
                },
                name: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20
                }
            },
        },
    }
}

export const dataModel: JsonSchema7 = {
    definitions: {
    ...projectSchema.definitions,
    ...systemModelSchema.definitions,
    ...lowLevelDesignModelSchema.definitions,
    ...rtlModelSchema.definitions,
    ...fpgaModelSchema.definitions,
    ...vlsiModelSchema.definitions,
    },
    $ref: '#/definitions/project'
}