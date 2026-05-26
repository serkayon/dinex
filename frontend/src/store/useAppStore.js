import { create } from "zustand";

const apiBaseUrl =
  import.meta.env
    .VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const normalizeSplitPlan = (
  splitPlan = []
) =>
  splitPlan.map((row) => ({
    ...row,
    from:
      row.from ||
      row.from_time,
  }));

const mapBatchToState = (
  batch
) => {
  if (!batch) {
    return {
      currentBatch: null,
      splitRows: [],
      batchStarted: false,
    };
  }

  const normalizedSplitPlan =
    normalizeSplitPlan(
      batch.splitPlan || []
    );

  return {
    currentBatch: {
      id: batch.id,
      teamLeader:
        batch.teamLeader,
      lineLeader:
        batch.lineLeader,
      supervisor:
        batch.supervisor,
      manpower:
        batch.manpower,
      shiftTime:
        batch.shiftTime,
      shift: {
        start:
          batch.shift_start,
        end: batch.shift_end,
        split:
          batch.shift_split,
      },
      splitPlan:
        normalizedSplitPlan,
      startedAt:
        batch.started_at,
      endedAt:
        batch.ended_at,
      status: batch.status,
    },
    splitRows: normalizedSplitPlan.map(
      (row) => ({
        hour: `${row.from} - ${row.to}`,
        target:
          Number(
            row.target
          ) || 0,
        model:
          row.modelId || "-",
      })
    ),
    batchStarted:
      batch.status ===
      "active",
  };
};

const useAppStore = create(
  (set, get) => ({
    sidebarCollapsed: false,
    people: [],
    models: [],
    manpower: [],
    downtime: [],
    currentBatch: null,
    batchStarted: false,
    splitRows: [],
    oee: {
      availability: 0,
      performance: 0,
      quality: 0,
      overall: 0,
    },

    toggleSidebar: () =>
      set((state) => ({
        sidebarCollapsed:
          !state.sidebarCollapsed,
      })),

    addPerson: (data) =>
      set((state) => ({
        people: [...state.people, data],
      })),

    setPeople: (people) =>
      set({
        people,
      }),

    addDowntime: (data) =>
      set((state) => ({
        downtime: [
          ...state.downtime,
          data,
        ],
      })),

    hydrateCurrentBatch:
      async () => {
        const response =
          await fetch(
            `${apiBaseUrl}/batches/active`
          );
        if (!response.ok) {
          throw new Error(
            "Failed to load active batch"
          );
        }
        const batch =
          await response.json();
        const mapped =
          mapBatchToState(batch);
        set(mapped);
        return mapped.currentBatch;
      },

    startBatch: async (data) => {
      const response =
        await fetch(
          `${apiBaseUrl}/batches/start`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              data
            ),
          }
        );

      if (!response.ok) {
        const errorBody =
          await response
            .json()
            .catch(() => ({}));
        throw new Error(
          errorBody.detail ||
            "Failed to start batch"
        );
      }

      const batch =
        await response.json();
      const mapped =
        mapBatchToState(batch);
      set(mapped);
      return mapped.currentBatch;
    },

    endBatch: async () => {
      const currentBatch =
        get().currentBatch;
      if (!currentBatch?.id) {
        throw new Error(
          "No active batch found"
        );
      }

      const response =
        await fetch(
          `${apiBaseUrl}/batches/${currentBatch.id}/end`,
          {
            method: "POST",
          }
        );
      if (!response.ok) {
        const errorBody =
          await response
            .json()
            .catch(() => ({}));
        throw new Error(
          errorBody.detail ||
            "Failed to end batch"
        );
      }

      await response.json();
      set({
        currentBatch: null,
        splitRows: [],
        batchStarted: false,
      });
    },

    updateSplitRow: (
      index,
      pendingData
    ) => {
      const rows = [
        ...get().splitRows,
      ];
      if (!rows[index]) return;
      rows[index] = {
        ...rows[index],
        pending: [
          ...(rows[index].pending ||
            []),
          pendingData,
        ],
      };
      set({
        splitRows: rows,
      });
    },

    calculateOEE: () => {
      const availability = 82;
      const performance = 76;
      const quality = 91;

      const overall =
        (
          (availability *
            performance *
            quality) /
          1000000
        ).toFixed(2) * 100;

      set({
        oee: {
          availability,
          performance,
          quality,
          overall,
        },
      });
    },
  })
);

export default useAppStore;
