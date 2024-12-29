import NoteEditor from '@/components/NoteEditor';

export default function NotePage({ params }: { params: { note_uuid: string } }) {
    return <NoteEditor noteUuid={params.note_uuid} />;
}