import UserRow from "./UserRow";

export default function UserTable({ users }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--secondary))] text-white">
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/10">User Profile</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/10">Platform Role</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-center border-r border-white/10">Account Status</th>
            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/10">Last Active</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Management</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium italic">
                No users found matching your criteria.
              </td>
            </tr>
          ) : (
            users.map((u: any) => (
              <UserRow key={u._id} user={u} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}