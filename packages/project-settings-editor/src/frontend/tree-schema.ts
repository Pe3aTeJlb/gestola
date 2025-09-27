/* See https://jsonforms.io for more information on how to configure data and ui schemas. */

import { JsonSchema7 } from "@jsonforms/core";

export const projectModelView = {
    'type': 'VerticalLayout',
    'elements': [
        {
            'type': 'Control',
            'label': 'Name',
            'scope': '#/properties/projName'
        }
    ]
};

export const lowLevelDesignModelView = {
    'type': 'VerticalLayout',
    'elements': [
        {
            'type': 'Control',
            'label': 'Name',
            'scope': '#/properties/name'
        }
    ]
};

export const rtlModelView = {
    'type': 'VerticalLayout',
    'elements': [
        {
            'type': 'Control',
            'label': 'Name',
            'scope': '#/properties/name'
        }
    ]
};

export const fpgaModelView = {
    'type': 'VerticalLayout',
    'elements': [
        {
            'type': 'Control',
            'label': 'Name',
            'scope': '#/properties/name'
        }
    ]
};

export const vlsiModelView = {
    'type': 'VerticalLayout',
    'elements': [
        {
            'type': 'Control',
            'label': 'Name',
            'scope': '#/properties/name'
        }
    ]
};

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
                projName: {
                    type: 'string',
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
            required: ['projName'],
        },
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
                },
                parent: {
                    $ref: '#/definitions/project'
                }
            },
        },
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
                lldName: {
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
                },
                parent: {
                    $ref: '#/definitions/project'
                }
            },
        },
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
                },
                parent: {
                    $ref: '#/definitions/lowLevelDesign'
                }
            },
        },
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
                },
                parent: {
                    $ref: '#/definitions/lowLevelDesign'
                }
            },
        },
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
                },
                parent: {
                    $ref: '#/definitions/lowLevelDesign'
                }
            },
        },
    },
    $ref: '#/definitions/project'
};