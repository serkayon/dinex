export default function OEE() {
  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <h2 className="text-xl font-bold">Availability</h2>
        <p className="text-5xl font-bold mt-5 text-green-600">0%</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <h2 className="text-xl font-bold">Performance</h2>
        <p className="text-5xl font-bold mt-5 text-blue-600">0%</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <h2 className="text-xl font-bold">Quality</h2>
        <p className="text-5xl font-bold mt-5 text-purple-600">0%</p>
      </div>
    </div>
  )
}