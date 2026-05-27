import { useEffect, useState } from "react";

import {
  Upload,
  User,
  BriefcaseBusiness,
  ImagePlus,
  Trash2,
  Pencil,
} from "lucide-react";

import toast from "react-hot-toast";

import useAppStore from "../../store/useAppStore";

export default function AssignPeople() {
  const { people, setPeople } =
    useAppStore();

  const [editMode, setEditMode] =
    useState(false);
const capitalize = (
  text = ""
) =>
  text.replace(
    /\b\w/g,
    (char) =>
      char.toUpperCase()
  );
  const [form, setForm] =
    useState({
      image: "",
      name: "",
      designation: "",
    });
  const [isSaving, setIsSaving] =
    useState(false);
  const [isLoading, setIsLoading] =
    useState(false);

  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL;

  const mapPerson = (person) => ({
    id: person.id,
    serialNo: person.serial_no,
    image: person.photo,
    name: person.employee_name,
    designation:
      person.designation,
  });

  const formatPersonRollNumber = (
    serialNo
  ) =>
    `P${String(
      Number(serialNo) || 0
    ).padStart(3, "0")}`;

  const fetchPeople =
    async () => {
      setIsLoading(true);
      try {
        const response =
          await fetch(
            `${apiBaseUrl}/people`
          );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch people"
          );
        }

        const data =
          await response.json();
        setPeople(
          data.map(mapPerson)
        );
      } catch (error) {
        toast.error(
          "Failed to load people"
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleImage = (e) => {
    const file =
      e.target.files[0];

    if (file) {
      const reader =
        new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          image:
            String(
              reader.result
            ),
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form.image) {
      toast.error(
        "Photo is required"
      );
      return;
    }

    if (!form.name.trim()) {
      toast.error(
        "Name is required"
      );
      return;
    }

    if (!form.designation) {
      toast.error(
        "Designation is required"
      );
      return;
    }

    setIsSaving(true);

    try {
      const response =
        await fetch(
          `${apiBaseUrl}/people`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              photo: form.image,
              employee_name:
                form.name.trim(),
              designation:
                form.designation,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to save person"
        );
      }

      const createdPerson =
        await response.json();

      setPeople([
        mapPerson(createdPerson),
        ...people,
      ]);

      toast.success(
        "Person Added Successfully"
      );

      setForm({
        image: "",
        name: "",
        designation: "",
      });
    } catch (error) {
      toast.error(
        "Failed to save person"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (
    deleteIndex
  ) => {
    const person =
      people[deleteIndex];

    if (!person?.id) {
      toast.error(
        "Person ID missing"
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${apiBaseUrl}/people/${person.id}`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to delete person"
        );
      }

      const updatedPeople =
        people.filter(
          (_, index) =>
            index !== deleteIndex
        );
      setPeople(updatedPeople);

      toast.success(
        "Person Deleted"
      );
    } catch (error) {
      toast.error(
        "Failed to delete person"
      );
    }
  };

  return (
    <div
      className="
        bg-white
        rounded-[28px]
        p-5
        md:p-6
        shadow-[0_2px_10px_rgba(15,23,42,0.05)]
      "
    >
      {/* HEADER */}
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
            Assign People
          </h2>

          <p
            className="
              text-slate-500
              text-sm
              mt-1
            "
          >
            Add production team
            members
          </p>
        </div>

        {/* TOGGLE */}
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
        {/* FORM */}
        <div
          className="
            bg-[#f8fafc]
            rounded-[24px]
            p-5
            border
            border-slate-200
          "
        >
          {/* IMAGE */}
          <label
            className="
              text-sm
              font-semibold
              text-slate-700
              mb-3
              flex
              items-center
              gap-2
            "
          >
            <ImagePlus
              size={16}
              className="text-[#1D60AB]"
            />

            Upload Photo
          </label>

          <label
            className="
              w-full
              h-[180px]
              border-2
              border-dashed
              border-[#cbd5e1]
              rounded-[24px]
              bg-white
              flex
              flex-col
              items-center
              justify-center
              cursor-pointer
              overflow-hidden
              hover:border-[#1D60AB]
            "
          >
            {form.image ? (
              <img
                src={form.image}
                alt="preview"
                className="
                  w-full
                  h-full
                  object-cover
                "
              />
            ) : (
              <>
                <div
                  className="
                    w-16
                    h-16
                    rounded-full
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                    mb-3
                  "
                >
                  <Upload
                    size={28}
                    className="text-[#1D60AB]"
                  />
                </div>

                <p className="font-semibold text-slate-700">
                  Upload Profile
                  Image
                </p>

                <span className="text-xs text-slate-400 mt-1">
                  JPG, PNG
                </span>
              </>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={
                handleImage
              }
              className="hidden"
            />
          </label>

          {/* NAME */}
          <div className="mt-5">
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
              <User
                size={16}
                className="text-[#1D60AB]"
              />

              Employee Name
            </label>

            <input
              placeholder="Enter employee name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value,
                })
              }
              className="
                w-full
                h-[52px]
                rounded-[16px]
                border
                border-slate-300
                px-4
                outline-none
                text-slate-700
                focus:border-[#1D60AB]
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>

          {/* DESIGNATION */}
          <div className="mt-5">
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
              <BriefcaseBusiness
                size={16}
                className="text-[#1D60AB]"
              />

              Designation
            </label>

            <select
              value={
                form.designation
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  designation:
                    e.target.value,
                })
              }
              className="
                w-full
                h-[52px]
                rounded-[16px]
                border
                border-slate-300
                px-4
                outline-none
                text-slate-700
                focus:border-[#1D60AB]
                focus:ring-4
                focus:ring-blue-100
              "
            >
              <option value="">
                Select Designation
              </option>

              <option>
                Supervisor
              </option>

              <option>
                Line Leader
              </option>

              <option>
                Team Leader
              </option>
            </select>
          </div>

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
                disabled:opacity-60
              "
            >
              {isSaving
                ? "Saving..."
                : "Save"}
            </button>

            <button
              onClick={() =>
                setForm({
                  image: "",
                  name: "",
                  designation:
                    "",
                })
              }
              className="
                flex-1
                h-[52px]
                rounded-[16px]
                bg-slate-200
                hover:bg-slate-300
                text-slate-700
                font-semibold
              "
            >
              Clear
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div
          className="
            overflow-hidden
            rounded-[24px]
            border
            border-slate-200
            bg-white
          "
        >
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
              Assigned People
            </h3>
          </div>

          <div className="overflow-x-auto">
         <div
  className="
    overflow-auto
max-h-[500px]
      custom-scrollbar
  "
>
  <table
    className="
      w-full
      border-collapse
    "
  ><thead
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
                  <th className="px-4 py-3 text-left text-sm font-semibold   border
    border-slate-200">
                    Roll ID
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold   border
    border-slate-200">
                    Photo
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold   border
    border-slate-200">
                    Name
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold   border
    border-slate-200">
                    Designation
                  </th>

                  {editMode && (
                    <th className="px-4 py-3 text-center text-sm font-semibold">
                      Delete
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {people.length ===
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
                      "
                    >
                      No people added
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
                      Loading people...
                    </td>
                  </tr>
                ) : (
                  people.map(
                    (
                      person,
                      index
                    ) => (
                      <tr
                        key={index}
                        className="
                          border-t
                          border-slate-100
                        "
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-[#1D60AB]   border
    border-slate-200">
                          {formatPersonRollNumber(
                            person.serialNo
                          )}
                        </td>

                        <td className="px-4 py-3   border
    border-slate-200">
                          <img
                            src={
                              person.image
                            }
                            alt="person"
                            className="
                              w-12
                              h-12
                              rounded-full
                              object-cover
                            "
                          />
                        </td>

                        <td className="px-4 py-3 text-sm font-semibold text-slate-700   border
    border-slate-200">
                          {capitalize(person.name)}
                        </td>

                        <td className="px-4 py-3 border border-slate-200">
                        <p
  className={`
    px-3
    py-1
    rounded-full
    text-sm
    font-semibold
    w-fit

    ${
      person.designation ===
      "Team Leader"
        ? "bg-[#f6e6ff] text-[#9102D0]"

        : person.designation ===
          "Line Leader"
        ? "bg-[#e8f1ff] text-[#4d7dff]"

        : "bg-[#e8fff1] text-[#22c55e]"
    }
  `}
>
  {person.designation}
</p>
                        </td>

                        {editMode && (
                          <td className="px-4 py-3 text-center">
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
    </div>
  );
}
