import React from "react";
import { Plus, Check, Bell } from "iconoir-react";
import ModalShell, { ModalHeader, ModalFooter, ModalBody } from "./ModalShell";
import FormField from "./FormField";
import LoadingButton from "./LoadingButton";
import CustomDropdown from "./CustomDropdown";

const NOTIFICATION_TIME_OPTIONS = [5, 10, 15, 30, 45, 60];

const inputClass =
  "w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600";

const ClassFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  isEditing,
  formData,
  onFormChange,
  daysOfWeek,
  classTypeColors,
  notificationTimeOptions = NOTIFICATION_TIME_OPTIONS,
}) => {
  const classTypeOptions = [
    { value: "LECTURE", label: "Lecture" },
    { value: "TUTORIAL", label: "Tutorial" },
    { value: "LAB", label: "Lab" },
    { value: "PRACTICAL", label: "Practical" },
    { value: "SEMINAR", label: "Seminar" },
  ];

  const toggleNotificationTime = (minutes) => {
    const current = formData.notificationTimes || [];
    const updated = current.includes(minutes)
      ? current.filter((t) => t !== minutes)
      : [...current, minutes];
    onFormChange("notificationTimes", updated);
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="2xl">
      <div className="max-h-[90vh] flex flex-col">
        <ModalHeader
          title={isEditing ? "Edit Class" : "Add Class"}
          subtitle={
            isEditing
              ? "Modify the class details"
              : "Schedule a new class to your timetable"
          }
          onClose={onClose}
        />

        <ModalBody scrollable>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            <FormField label="Day">
              <CustomDropdown
                colorScheme="blue"
                options={daysOfWeek.map((day) => ({
                  value: day,
                  label: day,
                }))}
                value={formData.day}
                onChange={(value) => onFormChange("day", value)}
              />
            </FormField>

            <FormField label="Type">
              <CustomDropdown
                colorScheme="blue"
                options={classTypeOptions}
                value={formData.type}
                onChange={(value) => {
                  onFormChange("type", value);
                  if (classTypeColors[value]) {
                    onFormChange("color", classTypeColors[value]);
                  }
                }}
              />
            </FormField>

            <FormField label="Start Time">
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => onFormChange("startTime", e.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="End Time">
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => onFormChange("endTime", e.target.value)}
                className={inputClass}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Subject Name">
                <input
                  type="text"
                  placeholder="e.g., Data Structures"
                  value={formData.subject}
                  onChange={(e) => onFormChange("subject", e.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField label="Subject Code">
              <input
                type="text"
                placeholder="e.g., CS201"
                value={formData.subjectCode}
                onChange={(e) => onFormChange("subjectCode", e.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="Professor Name">
              <input
                type="text"
                placeholder="e.g., Dr. Smith"
                value={formData.professor}
                onChange={(e) => onFormChange("professor", e.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="Professor Email">
              <input
                type="email"
                placeholder="professor@college.edu"
                value={formData.professorEmail}
                onChange={(e) => onFormChange("professorEmail", e.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="Room Number">
              <input
                type="text"
                placeholder="e.g., 101"
                value={formData.room}
                onChange={(e) => onFormChange("room", e.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="Building">
              <input
                type="text"
                placeholder="e.g., Building A"
                value={formData.building}
                onChange={(e) => onFormChange("building", e.target.value)}
                className={inputClass}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Color">
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(classTypeColors).map(([type, color]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onFormChange("color", color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all active:scale-95 ${
                        formData.color === color
                          ? "border-white scale-110"
                          : "border-transparent hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                      title={type}
                    />
                  ))}
                </div>
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Custom Note">
                <textarea
                  placeholder="Add any additional notes about this class..."
                  value={formData.customNote}
                  onChange={(e) => onFormChange("customNote", e.target.value)}
                  className={`${inputClass} h-24 resize-none`}
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-3 p-4 bg-zinc-800/20 border border-zinc-600/30 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) =>
                    onFormChange("notificationsEnabled", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-zinc-500 bg-zinc-700 cursor-pointer"
                />
                <label className="text-sm font-medium text-white cursor-pointer flex items-center gap-2">
                  <Bell size={16} />
                  Enable notifications for this class
                </label>
              </div>
            </div>

            {formData.notificationsEnabled && (
              <div className="md:col-span-2">
                <FormField label="Notify before">
                  <div className="flex flex-wrap gap-2">
                    {notificationTimeOptions.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => toggleNotificationTime(minutes)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all active:scale-95 ${
                          (formData.notificationTimes || []).includes(minutes)
                            ? "bg-blue-600/30 border-blue-500 text-blue-300"
                            : "bg-zinc-800 border-zinc-600 text-zinc-400 hover:border-zinc-500"
                        }`}
                      >
                        {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95 min-h-[44px]"
          >
            Cancel
          </button>
          <LoadingButton
            onClick={onSubmit}
            disabled={loading}
            loading={loading}
            loadingText={isEditing ? "Updating..." : "Adding..."}
            icon={isEditing ? Check : Plus}
            className="bg-zinc-700 hover:bg-zinc-600 shadow-lg"
          >
            {isEditing ? "Update Class" : "Add Class"}
          </LoadingButton>
        </ModalFooter>
      </div>
    </ModalShell>
  );
};

export { NOTIFICATION_TIME_OPTIONS };
export default ClassFormModal;
