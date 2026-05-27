import { useEffect, useState } from "react";

import {
  Users,
  ShieldCheck,
  UserCog,
  Trash2,
  Pencil,
  ChevronDown,
} from "lucide-react";

import toast from "react-hot-toast";

import useAppStore from "../../store/useAppStore";

function PersonDropdown({
  label,
  icon,
  placeholder,
  value,
  people,
  isOpen,
  onToggle,
  onSelect,
}) {
  const selectedPerson =
    people.find(
      (person) =>
        person.name === value
    ) || null;
  const formatPersonRollNumber = (
    serialNo
  ) =>
    `P${String(
      Number(serialNo) || 0
    ).padStart(3, "0")}`;
    
  return (
    <div className="mb-5">
      <label
        className="
          text-sm
          font-semibold
          text-slate-700
          mb-2
          flex
          items-center
          gap-2
        "
      >
        {icon}
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="
            w-full
            h-[52px]
            rounded-[16px]
            border
            border-slate-300
            px-3
            outline-none
            text-slate-700
            focus:border-[#1D60AB]
            focus:ring-4
            focus:ring-blue-100
            bg-white
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <span className="flex items-center gap-3 min-w-0">
            {selectedPerson ? (
              <>
                <img
                  src={selectedPerson.image}
                  alt={selectedPerson.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="truncate text-sm font-medium">
                  {`${formatPersonRollNumber(
                    selectedPerson.serialNo
                  )} - ${selectedPerson.name}`}
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-400">
                {placeholder}
              </span>
            )}
          </span>
          <ChevronDown size={16} className="text-slate-500" />
        </button>

        {isOpen && (
          <div
            className="
              absolute
              z-20
              mt-2
              w-full
              max-h-64
              overflow-auto
              rounded-[14px]
              border
              border-slate-200
              bg-white
              shadow-lg
            "
          >
            {people.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-400">
                No people available
              </div>
            ) : (
              people.map((person) => (
                <button
                  key={`${label}-${person.name}`}
                  type="button"
                  onClick={() => onSelect(person.name)}
                  className="
                    w-full
                    px-3
                    py-2.5
                    flex
                    items-center
                    gap-3
                    hover:bg-blue-50
                  "
                >
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-slate-700 text-left">
                    {`${formatPersonRollNumber(
                      person.serialNo
                    )} - ${person.name}`}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignBatchIncharge() {
  const { people } = useAppStore();

  const [editMode, setEditMode] =
    useState(false);

  const [batchPeople, setBatchPeople] =
    useState([]);
  const [isSaving, setIsSaving] =
    useState(false);
  const [isLoading, setIsLoading] =
    useState(false);
  const [openDropdown, setOpenDropdown] =
    useState("");
const capitalize = (
  text = ""
) =>
  text.replace(
    /\b\w/g,
    (char) =>
      char.toUpperCase()
  );
  const formatBatchInchargeNumber = (
    serialNo
  ) =>
    `B${String(
      Number(serialNo) || 0
    ).padStart(2, "0")}`;
  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL;

  const [form, setForm] =
    useState({
      lineLeaderName: "",
      teamLeaderName: "",
      supervisorName: "",
    });

  /* =========================
      FILTER PEOPLE
  ========================= */

  const lineLeaders =
    people.filter(
      (p) =>
        p.designation ===
        "Line Leader"
    );

  const teamLeaders =
    people.filter(
      (p) =>
        p.designation ===
        "Team Leader"
    );

  const supervisors =
    people.filter(
      (p) =>
        p.designation ===
        "Supervisor"
    );

  /* =========================
      SAVE
  ========================= */

  const fetchBatchPeople =
    async () => {
      setIsLoading(true);
      try {
        const response =
          await fetch(
            `${apiBaseUrl}/batch-incharges`
          );
        if (!response.ok) {
          throw new Error();
        }
        const data =
          await response.json();
        setBatchPeople(data);
      } catch (error) {
        toast.error(
          "Failed to load batch incharges"
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchBatchPeople();
  }, []);

  const handleSave = async () => {
    if (!form.lineLeaderName) {
      toast.error(
        "Line Leader required"
      );
      return;
    }

    if (!form.teamLeaderName) {
      toast.error(
        "Team Leader required"
      );
      return;
    }

    if (!form.supervisorName) {
      toast.error(
        "Supervisor required"
      );
      return;
    }

    setIsSaving(true);
    try {
      const response =
        await fetch(
          `${apiBaseUrl}/batch-incharges`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              line_leader_name:
                form.lineLeaderName,
              team_leader_name:
                form.teamLeaderName,
              supervisor_name:
                form.supervisorName,
            }),
          }
        );

      if (!response.ok) {
        const errorBody =
          await response.json();
        throw new Error(
          errorBody.detail ||
            "Failed to save batch incharge"
        );
      }

      const created =
        await response.json();

      setBatchPeople([
        created,
        ...batchPeople,
      ]);

      toast.success(
        "Batch Incharge Assigned"
      );

      setForm({
        lineLeaderName: "",
        teamLeaderName: "",
        supervisorName: "",
      });
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to save batch incharge"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================
      DELETE
  ========================= */

  const handleDelete = async (
    deleteIndex
  ) => {
    const selected =
      batchPeople[deleteIndex];

    if (!selected?.id) {
      toast.error(
        "Invalid record"
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${apiBaseUrl}/batch-incharges/${selected.id}`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        throw new Error();
      }

      const updated =
        batchPeople.filter(
          (_, index) =>
            index !== deleteIndex
        );

      setBatchPeople(updated);

      toast.success(
        "Deleted Successfully"
      );
    } catch (error) {
      toast.error(
        "Failed to delete"
      );
    }
  };

  /* =========================
      CLEAR
  ========================= */

  const handleClear = () => {
      setForm({
      lineLeaderName: "",
      teamLeaderName: "",
      supervisorName: "",
    });
  };

  return (
    <div
      className="
        bg-white
        rounded-[28px]
        p-5
        md:p-6
        shadow-[0_2px_10px_rgba(15,23,42,0.05)]
        mt-6
      "
    >
      {/* =========================
          HEADER
      ========================= */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          mb-6
        "
      >
        <div>
          <h2
            className="
              text-[24px]
              md:text-[28px]
              font-bold
              text-[#0f172a]
            "
          >
            Assign Batch Incharges
          </h2>

          <p
            className="
              text-slate-500
              text-sm
              mt-1
            "
          >
            Assign production
            incharge members
          </p>
        </div>

        {/* EDIT BUTTON */}
        <button
          onClick={() =>
            setEditMode(
              !editMode
            )
          }
          className={`
            h-[46px]
            px-5
            rounded-[14px]
            flex
            items-center
            gap-2
            font-semibold
            transition-all
            ${
              editMode
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-[#1D60AB]"
            }
          `}
        >
          <Pencil size={18} />

          {editMode
            ? "Exit Edit"
            : "Edit Mode"}
        </button>
      </div>

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-6
        "
      >
        {/* =========================
            FORM
        ========================= */}

        <div
          className="
            bg-[#f8fafc]
            rounded-[24px]
            p-5
            border
            border-slate-200
          "
        >
          <PersonDropdown
            label="Line Leader"
            icon={<UserCog size={16} className="text-[#1D60AB]" />}
            placeholder="Select Line Leader"
            value={form.lineLeaderName}
            people={lineLeaders}
            isOpen={openDropdown === "lineLeader"}
            onToggle={() =>
              setOpenDropdown((prev) =>
                prev === "lineLeader" ? "" : "lineLeader"
              )
            }
            onSelect={(selectedName) => {
              setForm({
                ...form,
                lineLeaderName: selectedName,
              });
              setOpenDropdown("");
            }}
          />

          <PersonDropdown
            label="Team Leader"
            icon={<Users size={16} className="text-[#1D60AB]" />}
            placeholder="Select Team Leader"
            value={form.teamLeaderName}
            people={teamLeaders}
            isOpen={openDropdown === "teamLeader"}
            onToggle={() =>
              setOpenDropdown((prev) =>
                prev === "teamLeader" ? "" : "teamLeader"
              )
            }
            onSelect={(selectedName) => {
              setForm({
                ...form,
                teamLeaderName: selectedName,
              });
              setOpenDropdown("");
            }}
          />

          <PersonDropdown
            label="Supervisor"
            icon={<ShieldCheck size={16} className="text-[#1D60AB]" />}
            placeholder="Select Supervisor"
            value={form.supervisorName}
            people={supervisors}
            isOpen={openDropdown === "supervisor"}
            onToggle={() =>
              setOpenDropdown((prev) =>
                prev === "supervisor" ? "" : "supervisor"
              )
            }
            onSelect={(selectedName) => {
              setForm({
                ...form,
                supervisorName: selectedName,
              });
              setOpenDropdown("");
            }}
          />

          {/* BUTTONS */}
          <div
            className="
              flex
              flex-col
              sm:flex-row
              gap-3
              mt-6
            "
          >
            {/* SAVE */}
            <button
              onClick={
                handleSave
              }
              disabled={isSaving}
              className="
                flex-1
                h-[52px]
                rounded-[16px]
                bg-[#1D60AB]
                hover:bg-[#164f90]
                text-white
                font-semibold
                shadow-md
                transition-all
                disabled:opacity-60
              "
            >
              {isSaving
                ? "Saving..."
                : "Save"}
            </button>

            {/* CLEAR */}
            <button
              onClick={
                handleClear
              }
              className="
                flex-1
                h-[52px]
                rounded-[16px]
                bg-slate-200
                hover:bg-slate-300
                text-slate-700
                font-semibold
                transition-all
              "
            >
              Clear
            </button>
          </div>
        </div>

        {/* =========================
            TABLE
        ========================= */}

        <div
          className="
            overflow-hidden
            rounded-[24px]
            border
            border-slate-200
            bg-white
          "
        >
          {/* TABLE HEADER */}
          <div
            className="
              bg-[#f8fafc]
              border-b
              border-slate-200
              px-5
              py-4
            "
          >
            <h3
              className="
                text-[18px]
                font-bold
                text-slate-800
              "
            >
              Assigned Incharges
            </h3>
          </div>

          {/* TABLE */}
   {/* TABLE */}
<div
  className="
    overflow-auto
    max-h-[340px]
    custom-scrollbar
  "
>
          <table
  className="
    w-full
    border
    border-slate-200
    border-collapse
  "
>
         <thead
  className="
    sticky
    top-0
    z-10
    bg-[#f8fafc]
  "
>
                <tr
                  className="
                    bg-[#f8fafc]
                    text-slate-600
                  "
                >
                  <th
  className="
    px-4
    py-3
    text-left
    text-sm
    font-semibold
    border
    border-slate-200
    bg-[#f8fafc]
    whitespace-nowrap
  "
>
                Team ID 
                  </th>

                  <th
  className="
    px-4
    py-3
    text-left
    text-sm
    font-semibold
    border
    border-slate-200
    bg-[#f8fafc]
    whitespace-nowrap
  "
>
                    Line Leader
                  </th>

                <th
  className="
    px-4
    py-3
    text-left
    text-sm
    font-semibold
    border
    border-slate-200
    bg-[#f8fafc]
    whitespace-nowrap
  "
>
                    Team Leader
                  </th>

                  <th
  className="
    px-4
    py-3
    text-left
    text-sm
    font-semibold
    border
    border-slate-200
    bg-[#f8fafc]
    whitespace-nowrap
  "
>
                    Supervisor
                  </th>

                  {editMode && (
                  <th
  className="
    px-4
    py-3
    text-left
    text-sm
    font-semibold
    border
    border-slate-200
    bg-[#f8fafc]
    whitespace-nowrap
  "
>
                      Delete
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {batchPeople.length ===
                  0 && !isLoading ? (
                  <tr>
                    <td
                      colSpan={
                        editMode
                          ? 5
                          : 4
                      }
                      className="
                        py-10
                        text-center
                        text-slate-400
                        text-sm
                          border
    border-slate-200
                      "
                    >
                      No batch incharge
                      assigned
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td
                      colSpan={
                        editMode
                          ? 5
                          : 4
                      }
                      className="
                        py-10
                        text-center
                        text-slate-400
                        text-sm
                        
                      "
                    >
                      Loading batch incharges...
                    </td>
                  </tr>
                ) : (
                  batchPeople.map(
                    (
                      item,
                      index
                    ) => (
                      <tr
                        key={index}
                        className="
                          border-t
                          border-slate-100
                        "
                      >
                        <td
                          className="
                            px-4
                            py-4
                            text-sm
                            font-bold
                            text-[#1D60AB]
                              border
    border-slate-200
                          "
                        >
                          {formatBatchInchargeNumber(
                            item.serial_no
                          )}
                        </td>

                        {/* LINE LEADER */}
                        <td
                          className="
                            px-4
                            py-4
                            text-sm
                            font-semibold
                            text-slate-700
                              border
    border-slate-200
                          "
                        >
                          {
                            capitalize(item.line_leader_name)
                          }
                        </td>

                        {/* TEAM LEADER */}
                        <td
                          className="
                            px-4
                            py-4
                            text-sm
                            font-semibold
                            text-slate-700
                              border
    border-slate-200
                          "
                        >
                          {
                            capitalize(item.team_leader_name)
                          }
                        </td>

                        {/* SUPERVISOR */}
                        <td
                          className="
                            px-4
                            py-4
                              border
    border-slate-200
                          "
                        >
                          <span
                            className="
                             px-4
                            py-4
                            text-sm
                            font-semibold
                            text-slate-700
                            
                            "
                          >
                            {
                              capitalize(item.supervisor_name)
                            }
                          </span>
                        </td>

                        {/* DELETE */}
                        {editMode && (
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() =>
                                handleDelete(
                                  index
                                )
                              }
                              className="
                                w-9
                                h-9
                                rounded-full
                                bg-red-100
                                hover:bg-red-200
                                text-red-600
                                inline-flex
                                items-center
                                justify-center
                              "
                            >
                              <Trash2
                                size={
                                  18
                                }
                              />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
