import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignTeacher } from "../api/course.api";
import API from "../api/axios";

export default function AssignTeacher({ subject }: any) {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => API.get("/users?role=teacher"),
  });

  const teachers = data?.data || [];

  const mutation = useMutation({
    mutationFn: (id: string) =>
      assignTeacher({ subjectId: subject._id, teacherIds: [id] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course"] });
    },
  });

  return (
    <select
      onChange={(e) => mutation.mutate(e.target.value)}
      className="p-2 border rounded dark:bg-gray-800"
    >
      <option>Select Teacher</option>
      {teachers.map((t: any) => (
        <option key={t._id} value={t._id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}