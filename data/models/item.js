module.exports = {
  definitions: {
    price: {
      type: "object",
      properties: {
        currency: {
          type: "string",
        },
        value: {
          type: "integer",
        },
      },
      additionalProperties: false,
    },
    buyPrices: {
      type: "array",
      items: {
        type: "object",
        properties: {
          currency: {
            type: "string",
          },
          value: {
            type: "integer",
          },
        },
        additionalProperties: false,
      },
    },
    game: {
      type: "object",
      properties: {
        orderable: {
          type: "boolean",
        },
        sources: {
          type: "array",
          items: {
            type: "string",
          },
        },
        sellPrice: {
          $ref: "#/definitions/price",
        },
        buyPrices: {
          type: "array",
          items: {
            $ref: "#/definitions/price",
          },
        },
      },
    },
  },

  type: "object",
  properties: {
    id: {
      type: "string",
    },
    name: {
      type: "string",
    },
    games: {
      type: "object",
      properties: {
        nl: {
          allOf: [
            {
              $ref: "#/definitions/game",
            },
          ],
          properties: {
            set: {
              type: "string",
            },
            rvs: {
              type: "array",
              items: {
                type: "string",
              },
            },
            interiorThemes: {
              type: "array",
              items: {
                type: "string",
              },
            },
            fashionThemes: {
              type: "array",
              items: {
                type: "string",
              },
            },
            orderable: {},
            sources: {},
            sellPrice: {},
            buyPrices: {},
          },
          additionalProperties: false,
        },
        ac: {
          $ref: "#/definitions/game",
          additionalProperties: false,
        },
        "afe+": {
          $ref: "#/definitions/game",
          additionalProperties: false,
        },
        nh: {
          allOf: [
            {
              $ref: "#/definitions/game",
            },
          ],
          properties: {
            recipe: {
              type: "object",
              patternProperties: {
                "^[\\w-]+$": {
                  type: "integer",
                },
              },
              additionalProperties: false,
            },
            variations: {
              type: "object",
              patternProperties: {
                "^[\\w-]+$": {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            customizable: {
              type: "boolean",
            },
            orderable: {},
            sources: {},
            sellPrice: {},
            buyPrices: {},
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    category: {
      type: "string",
    },
  },
  additionalProperties: false,
};
