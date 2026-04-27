import { Suspense } from 'react';
import { AdminBulkProductEditor } from '@ui/pages/admin/AdminBulkProductEditor';

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminBulkProductEditor />
        </Suspense>
    );
}
