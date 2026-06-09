'use client'

import { useState } from 'react'
import { PostForm } from '@/components/dashboard/PostForm'
import { ApprovalLinkDialog } from '@/components/dashboard/ApprovalLinkDialog'

export default function NuevaPublicacionPage() {
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null)
  return (
    <>
      <PostForm mode="create" onApprovalGenerated={setApprovalUrl} />
      <ApprovalLinkDialog url={approvalUrl} onClose={() => setApprovalUrl(null)} />
    </>
  )
}
