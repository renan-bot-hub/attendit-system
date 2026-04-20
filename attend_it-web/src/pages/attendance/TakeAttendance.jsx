export default function TakeAttendance() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Take Attendance</h1>
      <p className="text-slate-500 mt-2">Manual attendance checklist for teachers.</p>

      <div className="mt-8 p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center">
        <p className="text-slate-400 font-medium">Class list and present/absent toggles will go here.</p>
      </div>
    </div>
  );
}