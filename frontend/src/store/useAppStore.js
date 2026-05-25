import { create } from "zustand";

const generateSplitHours = (
  start,
  totalHours,
  split
) => {
  const rows = [];

  let current = Number(start);

  for (
    let i = 0;
    i < totalHours;
    i += Number(split)
  ) {
    let end = current + Number(split);

    rows.push({
      hour: `${current} - ${end}`,
      target: "-",
      actual: "-",
      okParts: "-",
      rework: "-",
      availability: "-",
      pending: [],
    });

    current = end;
  }

  return rows;
};

const useAppStore = create(
    (set, get) => ({
      sidebarCollapsed: false,

      people: [],
      models: [],
      manpower: [],
      downtime: [],

      shifts: {
        shiftA: {
          start: 6,
          end: 14,
          split: 1,
        },
      },

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

      startBatch: (data) => {
        const splitRows =
          generateSplitHours(
            data.shift.start,
            8,
            data.shift.split
          );

   set({
  currentBatch: data,
  splitRows,
  batchStarted: true,
});
      },

      endBatch: () =>
        set({
          currentBatch: null,
         
          splitRows: [],
           batchStarted: false,
        }),

      updateSplitRow: (
        index,
        pendingData
      ) => {
        const rows = [...get().splitRows];

        rows[index].pending.push(
          pendingData
        );

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
