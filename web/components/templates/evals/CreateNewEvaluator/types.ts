export type EvaluatorTestResult =
  | {
      output: string;
      traces: string[];
      statusCode?: number;
      _type: "completed";
    }
  | {
      _type: "running";
    }
  | {
      _type: "error";
      error: string;
    }
  | null;

export type TestInput = {
  inputBody: string;
  outputBody: string;
  inputs: {
    inputs: Record<string, string>;
    autoInputs?: Record<string, string>;
  };
  promptTemplate?: string;
};

export type DataEntry =
  | {
      _type: "system-prompt";
    }
  | {
      _type: "prompt-input";
      inputKey: string;
    }
  | {
      _type: "input-body";
      content: "jsonify" | "message";
    }
  | {
      _type: "output-body";
      content: "jsonify" | "message";
    };

type BaseLastMileConfigForm = {
  name: string;
  input: DataEntry;
  output: DataEntry;
};

export type LastMileConfigForm = BaseLastMileConfigForm &
  (
    | { _type: "relevance" | "context_relevance" }
    | { _type: "faithfulness"; groundTruth: DataEntry }
  );
