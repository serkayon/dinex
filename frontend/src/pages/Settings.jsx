import AssignPeople from '../components/settings/AssignPeople'
import AssignModel from '../components/settings/AssignModel'
import AssignBatchIncharge from "../components/settings/AssignBatchIncharge"
import ShiftTiming from '../components/settings/ShiftTiming'
import DowntimeAssign from '../components/settings/DowntimeAssign'
import ManPower from '../components/settings/ManPower'
import ShiftSplit from '../components/settings/ShiftSplitting'
export default function Settings() {
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <AssignPeople />
        <AssignBatchIncharge />
      <AssignModel />
      <ManPower />
      <DowntimeAssign />
      <ShiftTiming />
      <ShiftSplit />
    </div>
  )
}