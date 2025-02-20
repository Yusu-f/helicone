import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { IslandContainer } from "@/components/ui/islandContainer";
import HcBreadcrumb from "@/components/ui/hcBreadcrumb";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { ListIcon, PlayIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import ExperimentInputSelector from "../experimentInputSelector";
import { ExperimentRandomInputSelector } from "../experimentRandomInputSelector";
import AddColumnDialog from "./AddColumnDialog";
import AddColumnHeader from "./AddColumnHeader";
import AddManualRowPanel from "./AddManualRowPanel";
import { HypothesisCellRenderer } from "./cells/HypothesisCellRenderer";
import { AddRowPopover } from "./components/addRowPopover";
import {
  ExperimentTableHeader,
  IndexColumnCell,
  InputCell,
  InputsHeaderComponent,
  PromptColumnHeader,
} from "./components/tableElementsRenderer";
import EditInputsPanel from "./EditInputsPanel";
import { useExperimentTable } from "./hooks/useExperimentTable";
import ScoresEvaluatorsConfig from "./scores/ScoresEvaluatorsConfig";
import ScoresGraphContainer from "./scores/ScoresGraphContainer";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ExperimentDatasetSelector from "../experimentDatasetSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ImportCSVDialog from "./ImportCSVDialog";

type TableDataType = {
  index: number;
  inputs: Record<string, string>;
  autoInputs: any[];
  rowRecordId: string;
  add_prompt: string;
  originalInputRecordId: string;
  [key: `prompt_version_${string}`]: {
    request_id: string;
    input_record_id: string;
  };
};

export function ExperimentTable({
  experimentTableId,
}: {
  experimentTableId: string;
}) {
  const {
    experimentTableQuery,
    promptVersionTemplateData,
    promptVersionsData,
    addExperimentTableRowInsertBatch,
    addExperimentTableRowInsertFromDatasetBatch,
    inputKeysData,
    wrapText,
    deleteSelectedRows,
  } = useExperimentTable(experimentTableId);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);
  const [showRandomInputSelector, setShowRandomInputSelector] = useState(false);
  const [showExperimentDatasetSelector, setShowExperimentDatasetSelector] =
    useState(false);
  const [rightPanel, setRightPanel] = useState<
    "edit_inputs" | "add_manual" | null
  >(null);
  const [toEditInputRecord, setToEditInputRecord] = useState<{
    id: string;
    inputKV: Record<string, string>;
    autoInputs: Record<string, any>;
  } | null>(null);
  const [showScores, setShowScores] = useState(false);
  const [showDeleteRowsConfirmation, setShowDeleteRowsConfirmation] =
    useState(false);

  const cellRefs = useRef<Record<string, any>>({});
  const [
    externallySelectedForkFromPromptVersionId,
    setExternallySelectedForkFromPromptVersionId,
  ] = useState<string | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [showImportCsvModal, setShowImportCsvModal] = useState(false);

  const [rowSelection, setRowSelection] = useState({});

  const columnHelper = createColumnHelper<TableDataType>();

  const columnDef: ReturnType<typeof columnHelper.group>[] = useMemo(
    () => [
      columnHelper.group({
        id: "index__outer",
        header: () =>
          table.getIsSomeRowsSelected() || table.getIsAllRowsSelected() ? (
            <div className="flex justify-center items-center text-slate-400 dark:text-slate-600 group relative">
              <input
                type="checkbox"
                className="appearance-none relative peer shrink-0 border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 checked:bg-slate-800 dark:checked:bg-slate-300 checked:border-0 h-4 w-4 self-center rounded-sm text-white dark:text-slate-900 cursor-pointer"
                checked={!!table.getIsAllRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
              />
              <svg
                className="absolute w-4 h-4  hidden peer-checked:block pointer-events-none text-white dark:text-slate-900"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          ) : (
            <div className="flex justify-center items-center text-slate-400 dark:text-slate-600 group relative">
              <span className="group-hover:invisible transition-opacity duration-200">
                <ListIcon className="w-4 h-4" />
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="ml-2 p-0 border rounded-md h-[22px] w-[24px] items-center justify-center absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <PlayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onSelect={async () => {
                      await Promise.all(
                        (promptVersionsData ?? []).map(async (pv) => {
                          const rows = table.getRowModel().rows;
                          await Promise.all(
                            rows.map(async (row) => {
                              const cellRef =
                                cellRefs.current[`${row.id}-${pv.id}`];
                              if (cellRef) {
                                await cellRef.runHypothesis();
                              }
                            })
                          );
                        })
                      );
                    }}
                  >
                    Run all cells
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      await Promise.all(
                        (promptVersionsData ?? []).map(async (pv) => {
                          const rows = table.getRowModel().rows;
                          await Promise.all(
                            rows.map(async (row) => {
                              const cellRef =
                                cellRefs.current[`${row.id}-${pv.id}`];
                              if (cellRef) {
                                await cellRef.runHypothesisIfRequired();
                              }
                            })
                          );
                        })
                      );
                    }}
                  >
                    Run unexecuted cells
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        columns: [
          columnHelper.accessor("index", {
            header: () => <></>,
            cell: ({ row }) => (
              <IndexColumnCell
                areSomeSelected={table.getIsSomeRowsSelected()}
                isSelected={row.getIsSelected()}
                onSelectChange={row.getToggleSelectedHandler()}
                index={row.original.index}
                onRunRow={async () => {
                  await Promise.all(
                    (promptVersionsData ?? []).map((pv) => {
                      const cellRef = cellRefs.current[`${row.id}-${pv.id}`];
                      if (cellRef) {
                        cellRef.runHypothesis();
                      }
                    })
                  );
                }}
              />
            ),
            size: 80,
            enableResizing: false,
          }),
        ],
      }),
      columnHelper.group({
        id: "inputs__outer",
        header: () => (
          <PromptColumnHeader label="Inputs" promptVersionId="inputs" />
        ),
        columns: [
          columnHelper.accessor("inputs", {
            header: () => (
              <InputsHeaderComponent inputs={inputKeysData ?? []} />
            ),
            cell: ({ row }) => (
              <InputCell
                experimentInputs={inputKeysData ?? []}
                rowInputs={row.original.inputs}
                rowRecordId={row.original.rowRecordId}
                experimentAutoInputs={row.original.autoInputs}
                onClick={() => {
                  setToEditInputRecord({
                    id: row.original.originalInputRecordId ?? "",
                    inputKV: row.original.inputs,
                    autoInputs: row.original.autoInputs,
                  });
                  setRightPanel("edit_inputs");
                }}
              />
            ),
            size: 250,
            enableResizing: true,
          }),
        ],
      }),
      ...(promptVersionsData ?? []).map((pv) =>
        columnHelper.group({
          id: `prompt_version_${pv.id}__outer`,
          header: () => (
            <PromptColumnHeader
              promptVersionId={pv.id}
              label={
                pv.metadata?.label
                  ? `${pv.metadata?.label}`
                  : `v${pv.major_version}.${pv.minor_version}`
              }
              onForkColumn={() => {
                setExternallySelectedForkFromPromptVersionId(pv.id);
                setIsAddColumnDialogOpen(true);
              }}
              onRunColumn={async () => {
                const rows = table.getRowModel().rows;

                await Promise.all(
                  rows.map(async (row) => {
                    const cellRef = cellRefs.current[`${row.id}-${pv.id}`];
                    if (cellRef) {
                      await cellRef.runHypothesis();
                    }
                  })
                );
              }}
            />
          ),
          columns: [
            columnHelper.accessor(`prompt_version_${pv.id}`, {
              header: () => (
                <ExperimentTableHeader
                  experimentId={experimentTableId}
                  isOriginal={
                    pv.id ===
                    experimentTableQuery?.copied_original_prompt_version
                  }
                  promptVersionId={pv.id}
                  originalPromptTemplate={promptVersionTemplateData}
                  originalPromptVersionId={
                    experimentTableQuery?.copied_original_prompt_version ?? ""
                  }
                  onForkPromptVersion={(promptVersionId: string) => {
                    setExternallySelectedForkFromPromptVersionId(
                      promptVersionId
                    );
                    setIsAddColumnDialogOpen(true);
                  }}
                />
              ),
              cell: ({ row }) => (
                <HypothesisCellRenderer
                  ref={(el) => {
                    if (el) {
                      cellRefs.current[`${row.id}-${pv.id}`] = el;
                    }
                  }}
                  experimentTableId={experimentTableId}
                  requestId={
                    row.original[`prompt_version_${pv.id}`]?.request_id ?? ""
                  }
                  inputRecordId={row.original.rowRecordId ?? ""}
                  prompt={promptVersionTemplateData}
                  promptVersionId={pv.id}
                />
              ),
              size: 400,
            }),
          ],
        })
      ),
      columnHelper.group({
        id: "add_prompt__outer",
        header: () => (
          <AddColumnHeader
            experimentId={experimentTableId}
            promptVersionId={
              experimentTableQuery?.original_prompt_version ?? ""
            }
            selectedProviderKey=""
            handleAddColumn={async () => {}}
            wrapText={false}
            originalColumnPromptVersionId={promptVersionsData?.[0]?.id ?? ""}
            experimentPromptVersions={
              promptVersionsData?.map((pv) => ({
                id: pv.id,
                metadata: pv.metadata ?? {},
                major_version: pv.major_version,
                minor_version: pv.minor_version,
              })) ?? []
            }
            numberOfExistingPromptVersions={
              promptVersionsData?.length ? promptVersionsData.length - 1 : 0
            }
          />
        ),
        columns: [
          columnHelper.accessor("add_prompt", {
            header: () => <></>,
            cell: ({ row }) => <div></div>,
          }),
        ],
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      inputKeysData,
      promptVersionsData,
      experimentTableQuery,
      experimentTableId,
      promptVersionTemplateData,
      setExternallySelectedForkFromPromptVersionId,
      setIsAddColumnDialogOpen,
    ]
  );

  const tableData = useMemo<TableDataType[]>(() => {
    if (!experimentTableQuery?.rows || !promptVersionsData) return [];

    return experimentTableQuery.rows.map((row, i) => ({
      index: i + 1,
      inputs: row.inputs,
      rowRecordId: row.id,
      ...(promptVersionsData ?? []).reduce(
        (acc, pv) => ({
          ...acc,
          [`prompt_version_${pv.id}`]: row.requests.find(
            (r) => r.prompt_version_id === pv.id
          ),
        }),
        {}
      ),
      add_prompt: "",
      autoInputs: row.auto_prompt_inputs,
      originalInputRecordId:
        row.requests.find(
          (r) =>
            r.prompt_version_id ===
            experimentTableQuery?.copied_original_prompt_version
        )?.input_record_id ?? "",
    }));
  }, [
    experimentTableQuery?.rows,
    promptVersionsData,
    experimentTableQuery?.copied_original_prompt_version,
  ]);

  const tableConfig = useMemo(
    () => ({
      data: tableData,
      columns: columnDef,
      state: {
        rowSelection,
      },
      onRowSelectionChange: setRowSelection,
      defaultColumn: {
        minSize: 50,
        maxSize: 1000,
        size: 200,
        enableResizing: true,
      },
      getCoreRowModel: getCoreRowModel(),
      enableColumnResizing: true,
      enableRowSelection: true,
      columnResizeMode: "onChange" as const,
    }),
    [tableData, columnDef, rowSelection]
  );

  const table = useReactTable(tableConfig);

  const handleAddRowInsertBatch = useCallback(
    (
      rows: {
        inputRecordId: string;
        inputs: Record<string, string>;
        autoInputs: any[];
      }[]
    ) => {
      const newRows = rows.map((row) => ({
        inputRecordId: row.inputRecordId,
        inputs: row.inputs,
        autoInputs: row.autoInputs,
      }));

      if (!newRows.length) return;

      addExperimentTableRowInsertBatch.mutate({
        rows: newRows,
      });
    },
    [addExperimentTableRowInsertBatch]
  );

  const handleAddRowInsertBatchFromDataset = useCallback(
    (datasetId: string) => {
      addExperimentTableRowInsertFromDatasetBatch.mutate({
        datasetId,
      });
    },
    [addExperimentTableRowInsertFromDatasetBatch]
  );

  const queryClient = useQueryClient();

  const handleShowScoresChange = useCallback(
    (checked: boolean) => {
      if (!checked) {
        queryClient.setQueryData(["selectedScoreKey", experimentTableId], null);
        queryClient.setQueryData(["experimentScores", experimentTableId], {});

        for (const promptVersion of promptVersionsData ?? []) {
          queryClient.setQueryData(
            ["experimentScores", experimentTableId, promptVersion.id],
            {}
          );
        }
      }
      setShowScores(checked);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, experimentTableId]
  );

  return (
    <>
      <div className="flex justify-between items-center py-4 pr-4">
        <IslandContainer>
          <HcBreadcrumb
            pages={[
              {
                href: "/experiments",
                name: "Experiments",
              },
              {
                href: `/experiments/${experimentTableId}`,
                name: experimentTableQuery?.name ?? "Experiment",
              },
            ]}
          />
        </IslandContainer>
        <div className="flex items-center gap-5">
          {!(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) ? (
            <>
              <div className="flex gap-2 items-center relative">
                <Switch
                  size="sm"
                  checked={showScores}
                  onCheckedChange={(checked) => {
                    handleShowScoresChange(checked);
                    setShowScores(checked);
                  }}
                />
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  Show scores
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Switch
                  size="sm"
                  checked={wrapText.data ?? false}
                  onCheckedChange={(checked) => {
                    queryClient.setQueryData(
                      ["wrapText", experimentTableId],
                      checked
                    );
                  }}
                />
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  Wrap text
                </p>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  table.resetRowSelection();
                }}
              >
                Deselect all
              </Button>
              <AlertDialog
                open={showDeleteRowsConfirmation}
                onOpenChange={setShowDeleteRowsConfirmation}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Trash2Icon className="w-3.5 h-3.5" />
                    Delete row
                    {table.getFilteredSelectedRowModel().rows.length === 1
                      ? ""
                      : "s"}{" "}
                    {table.getFilteredSelectedRowModel().rows.length > 1 &&
                      `(${
                        table.getFilteredSelectedRowModel().rows.length
                      } selected)`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete rows</AlertDialogTitle>
                    <AlertDialogDescription>
                      Once deleted, these rows cannot be recovered. Do you want
                      to delete them?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="w-full items-stretch gap-2">
                    <AlertDialogCancel>Go back</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteSelectedRows.mutate({
                          inputRecordIds: table
                            .getFilteredSelectedRowModel()
                            .rows.map((row) => row.original.rowRecordId),
                        });
                        setShowDeleteRowsConfirmation(false);
                        table.resetRowSelection();
                      }}
                    >
                      Yes, delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
      <div className="h-[calc(100vh-50px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={75}>
            <div className="flex flex-col w-full">
              {showScores && (
                <div className="flex flex-col w-full bg-white dark:bg-neutral-950 border-y border-r border-slate-200 dark:border-slate-800">
                  {promptVersionsData && (
                    <ScoresGraphContainer
                      promptVersions={(promptVersionsData ?? []).map((pv) => ({
                        ...pv,
                        metadata: pv.metadata ?? {},
                      }))}
                      experimentId={experimentTableId}
                    />
                  )}
                  <div className="flex justify-between items-center bg-white dark:bg-neutral-950 p-2">
                    <ScoresEvaluatorsConfig experimentId={experimentTableId} />
                  </div>
                </div>
              )}
              <div
                className={clsx(
                  "bg-white dark:bg-neutral-950 w-full overflow-x-auto",
                  showScores
                    ? "h-[calc(100vh-90px-300px-50px)]"
                    : "h-[calc(100vh-90px)]"
                )}
              >
                <div
                  className="bg-white dark:bg-black rounded-sm inline-block min-w-0 w-max h-auto"
                  // style={{ width: "fit-content" }}
                >
                  <Table className="border-collapse border-t border-r border-b border-slate-200 dark:border-slate-800 h-[1px]">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup, i) => (
                        <TableRow
                          key={headerGroup.id}
                          className={clsx(
                            "sticky top-0 bg-slate-50 dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800",
                            i === 1 && "h-[225px]"
                          )}
                        >
                          {headerGroup.headers.map((header, index) => (
                            <TableHead
                              key={header.id}
                              style={{ width: header.getSize() }}
                              className={cn(
                                "bg-white dark:bg-neutral-950 relative p-0",
                                index < headerGroup.headers.length - 1 &&
                                  "border-r border-slate-200 dark:border-slate-800"
                              )}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                              <div
                                className="resizer absolute right-0 top-0 h-full w-4 cursor-col-resize"
                                {...{
                                  onMouseDown: header.getResizeHandler(),
                                  onTouchStart: header.getResizeHandler(),
                                }}
                              >
                                <div
                                  className={clsx(
                                    "h-full w-1",
                                    header.column.getIsResizing()
                                      ? "bg-blue-700 dark:bg-blue-300"
                                      : "bg-gray-500"
                                  )}
                                />
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody className="text-[13px] bg-white dark:bg-neutral-950">
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            onClick={(e) => {
                              if (
                                table.getIsSomeRowsSelected() ||
                                table.getIsAllRowsSelected()
                              ) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                                row.getToggleSelectedHandler()(e);
                              }
                            }}
                            onMouseDown={(e) => {
                              if (
                                table.getIsSomeRowsSelected() ||
                                table.getIsAllRowsSelected()
                              ) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className={cn(
                              "border-b border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-neutral-950 dark:data-[state=selected]:bg-slate-900",
                              (table.getIsSomeRowsSelected() ||
                                table.getIsAllRowsSelected()) &&
                                "cursor-pointer pointer-events-auto"
                            )}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                className={cn(
                                  "p-0 align-baseline border-r border-slate-200 dark:border-slate-800 h-full relative group",
                                  "w-full max-w-0",
                                  cell.column.getIsLastColumn() && "border-r-0",
                                  (table.getIsSomeRowsSelected() ||
                                    table.getIsAllRowsSelected()) &&
                                    "[&_*]:pointer-events-none"
                                )}
                                style={{
                                  width: cell.column.getSize(),
                                  maxWidth: cell.column.getSize(),
                                }}
                                key={cell.id}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columnDef.length}
                            className="h-24 text-center"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start flex flex-row space-x-2 text-slate-800 mt-0 shadow-none"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add row
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full px-2 py-2">
                    <AddRowPopover
                      setPopoverOpen={setPopoverOpen}
                      setShowAddManualRow={() => setRightPanel("add_manual")}
                      setShowExperimentInputSelector={
                        setShowExperimentInputSelector
                      }
                      setShowRandomInputSelector={setShowRandomInputSelector}
                      setShowExperimentDatasetSelector={
                        setShowExperimentDatasetSelector
                      }
                      setShowImportCsvModal={setShowImportCsvModal}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <ExperimentRandomInputSelector
                open={showRandomInputSelector}
                setOpen={setShowRandomInputSelector}
                handleAddRows={handleAddRowInsertBatch}
                promptVersionId={
                  experimentTableQuery?.original_prompt_version ?? ""
                }
                onSuccess={async (success) => {}}
              />

              <ExperimentInputSelector
                open={showExperimentInputSelector}
                setOpen={setShowExperimentInputSelector}
                promptVersionId={
                  experimentTableQuery?.original_prompt_version ?? ""
                }
                handleAddRows={handleAddRowInsertBatch}
                onSuccess={async (success) => {}}
              />

              <ExperimentDatasetSelector
                open={showExperimentDatasetSelector}
                setOpen={setShowExperimentDatasetSelector}
                experimentId={experimentTableId}
                promptVersionId={
                  experimentTableQuery?.original_prompt_version ?? ""
                }
                handleAddRows={handleAddRowInsertBatchFromDataset}
                onSuccess={async (success) => {}}
              />
            </div>
          </ResizablePanel>

          {/* Add right panel if needed */}
          {rightPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel minSize={25} maxSize={75}>
                <div className="h-full flex-shrink-0 flex flex-col">
                  {rightPanel === "edit_inputs" && (
                    <EditInputsPanel
                      experimentId={experimentTableId}
                      inputRecord={toEditInputRecord}
                      inputKeys={inputKeysData ?? []}
                      autoInputs={toEditInputRecord?.autoInputs ?? {}}
                      onClose={() => {
                        setToEditInputRecord(null);
                        setRightPanel(null);
                      }}
                    />
                  )}
                  {rightPanel === "add_manual" && (
                    <AddManualRowPanel
                      experimentId={experimentTableId}
                      inputKeys={inputKeysData ?? []}
                      onClose={() => setRightPanel(null)}
                    />
                  )}
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
        <AddColumnDialog
          isOpen={isAddColumnDialogOpen}
          onOpenChange={setIsAddColumnDialogOpen}
          experimentId={experimentTableId}
          originalColumnPromptVersionId={promptVersionsData?.[0]?.id ?? ""}
          selectedForkFromPromptVersionId={
            externallySelectedForkFromPromptVersionId ?? ""
          }
          numberOfExistingPromptVersions={
            promptVersionsData?.length ? promptVersionsData.length - 1 : 0
          }
        />
        <ImportCSVDialog
          open={showImportCsvModal}
          onOpenChange={setShowImportCsvModal}
          experimentId={experimentTableId}
          experimentPromptInputKeys={inputKeysData?.map((key) => key) ?? []}
        />
      </div>
    </>
  );
}
