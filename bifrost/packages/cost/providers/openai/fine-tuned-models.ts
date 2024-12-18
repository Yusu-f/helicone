/**
 *
 * DO NOT EDIT THIS FILE UNLESS IT IS IN /costs
 */

import { ModelRow } from "../../interfaces/Cost";

export const costs: ModelRow[] = [
  {
    model: {
      operator: "startsWith",
      value: "ft:gpt-3.5-turbo-",
    },
    cost: {
      prompt_token: 0.000003,
      completion_token: 0.000006,
    },
  },
  {
    model: {
      operator: "startsWith",
      value: "ft:gpt-4o-mini-2024-07-18:",
    },
    cost: {
      prompt_token: 0.0000003,
      completion_token: 0.0000012
    }
  },
  {
    model: {
      operator: "startsWith",
      value: "ft:gpt-4o-2024-08-06:",
    },
    cost: {
      prompt_token: 0.00000375,
      completion_token: 0.000015
    }
  }
];
