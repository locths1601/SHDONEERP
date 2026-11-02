import React, { useState, useRef } from 'react';
import {
  X,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Upload,
  Download,
  FileText,
  Shield,
  Plus,
  RefreshCw,
  Send,
  Ban,
  RotateCcw,
} from 'lucide-react';
import {
  useApplicationDetail,
  useUpdateApplicationStatus,
  useVerifyChecklistItem,
  useRejectChecklistItem,
  useResetChecklistItem,
  useUploadDocument,
  useAddChecklistItem,
} from '../hooks/useStudents';
import { studentWorkspaceService } from '../services/studentWorkspaceService';

interface ApplicationDetailModalProps {
  applicationId: string;
  onClose: () => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  applicationId,
  onClose,
}) => {
  const { data: application, isLoading, isError, error, refetch, isFetching } = useApplicationDetail(applicationId);

  // Status transitions
  const updateStatusMutation = useUpdateApplicationStatus(applicationId, application?.studentPartyId);
  const verifyItemMutation = useVerifyChecklistItem(applicationId);
  const rejectItemMutation = useRejectChecklistItem(applicationId);
  const resetItemMutation = useResetChecklistItem(applicationId);
  const uploadDocMutation = useUploadDocument(applicationId);
  const addChecklistItemMutation = useAddChecklistItem(applicationId);

  // Rejection dialog state
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [rejectingItemRowVersion, setRejectingItemRowVersion] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Add custom item dialog
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemCode: '',
    itemName: '',
    category: 'Other',
    isRequired: true,
    notes: '',
  });

  // Hidden file inputs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    await updateStatusMutation.mutateAsync({
      status: newStatus,
      rowVersion: application.rowVersion,
    });
  };

  const handleVerify = async (itemId: string, rowVersion: string) => {
    await verifyItemMutation.mutateAsync({
      itemId,
      data: {
        rowVersion,
        notes: 'Hồ sơ đã được chuyên viên thẩm định và xác nhận tính hợp lệ.',
      },
    });
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItemId || !rejectionReason.trim()) return;

    await rejectItemMutation.mutateAsync({
      itemId: rejectingItemId,
      data: {
        rejectionReason: rejectionReason.trim(),
        rowVersion: rejectingItemRowVersion,
      },
    });

    setRejectingItemId(null);
    setRejectionReason('');
  };

  const handleFileChange = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadDocMutation.mutateAsync({ itemId, file });
    if (fileInputRefs.current[itemId]) {
      fileInputRefs.current[itemId]!.value = '';
    }
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.itemCode.trim() || !newItem.itemName.trim()) return;

    await addChecklistItemMutation.mutateAsync({
      itemCode: newItem.itemCode.trim().toUpperCase(),
      itemName: newItem.itemName.trim(),
      category: newItem.category,
      isRequired: newItem.isRequired,
      notes: newItem.notes.trim() || undefined,
    });

    setIsAddItemOpen(false);
    setNewItem({
      itemCode: '',
      itemName: '',
      category: 'Other',
      isRequired: true,
      notes: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Bản nháp (Draft)</span>;
      case 'Submitted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Đã nộp hồ sơ</span>;
      case 'UnderReview':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Đang thẩm định Visa</span>;
      case 'Accepted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Đã đậu Visa / Chấp thuận</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Từ chối Visa</span>;
      case 'Withdrawn':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Đã rút hồ sơ</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
          </span>
        );
      case 'Uploaded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" /> Chờ thẩm định
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5" /> Bị từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" /> Chờ bổ sung
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Identity': return 'Giấy tờ nhân thân & Căn cước';
      case 'Academic': return 'Học bạ, Bằng cấp & Bảng điểm';
      case 'Financial': return 'Chứng minh tài chính & Sổ tiết kiệm';
      case 'Medical': return 'Giấy khám sức khỏe & Y tế';
      case 'Legal': return 'Lý lịch tư pháp & Giấy tờ pháp lý';
      default: return 'Hồ sơ bổ trợ khác';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 font-mono">
                  {application?.applicationCode || 'Chi tiết hồ sơ tuyển sinh'}
                </h2>
                {application && getStatusBadge(application.status)}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Học viên: <span className="font-semibold text-gray-800">{application?.studentName}</span> ({application?.studentCode}) • Pháp nhân: <span className="font-medium text-gray-700">{application?.legalEntityName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isLoading ? (
          <div className="p-12 space-y-4 flex-1 overflow-y-auto">
            <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ) : isError || !application ? (
          <div className="p-12 text-center flex-1">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Lỗi tải chi tiết hồ sơ</h3>
            <p className="text-sm text-gray-500 mb-4">{(error as any)?.message || 'Không tìm thấy hồ sơ chỉ định.'}</p>
            <button onClick={() => refetch()} className="px-4 py-2 border rounded-lg text-sm">Thử lại</button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Overview & Workflow Stepper Card */}
            <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block">Thị trường</span>
                  <span className="font-bold text-gray-900 text-sm">{application.targetMarket}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Kỳ tuyển sinh</span>
                  <span className="font-semibold text-gray-800">{application.intakeTerm}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Chương trình</span>
                  <span className="font-semibold text-gray-800">{application.programName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Tiến độ Checklist</span>
                  <span className="font-bold text-blue-600">
                    {application.checklistItems.filter((c) => c.status === 'Verified').length} /{' '}
                    {application.checklistItems.length} hạng mục hợp lệ
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {application.status === 'Draft' && (
                  <button
                    disabled={updateStatusMutation.isPending}
                    onClick={() => handleStatusChange('Submitted')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Nộp hồ sơ (Submitted)
                  </button>
                )}

                {application.status === 'Submitted' && (
                  <button
                    disabled={updateStatusMutation.isPending}
                    onClick={() => handleStatusChange('UnderReview')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Bắt đầu thẩm định hồ sơ Visa
                  </button>
                )}

                {application.status === 'UnderReview' && (
                  <>
                    <button
                      disabled={updateStatusMutation.isPending}
                      onClick={() => handleStatusChange('Accepted')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Chấp thuận / Đậu Visa
                    </button>
                    <button
                      disabled={updateStatusMutation.isPending}
                      onClick={() => handleStatusChange('Rejected')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Từ chối Visa
                    </button>
                  </>
                )}

                {['Draft', 'Submitted'].includes(application.status) && (
                  <button
                    disabled={updateStatusMutation.isPending}
                    onClick={() => handleStatusChange('Withdrawn')}
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-medium transition"
                  >
                    Rút hồ sơ
                  </button>
                )}
              </div>
            </div>

            {/* Checklist Items Management Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Danh mục hồ sơ & Checklist thẩm định Visa ({application.checklistItems.length} hạng mục)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Mỗi hạng mục yêu cầu đính kèm file scan hợp lệ và được chuyên viên đối soát ký xác nhận
                  </p>
                </div>
                <button
                  onClick={() => setIsAddItemOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm hạng mục tài liệu
                </button>
              </div>

              {/* Group items by Category */}
              {['Identity', 'Academic', 'Financial', 'Medical', 'Legal', 'Other'].map((category) => {
                const itemsInCategory = application.checklistItems.filter((c) => c.category === category);
                if (itemsInCategory.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1 pt-2">
                      {getCategoryLabel(category)}
                    </div>

                    <div className="space-y-2.5">
                      {itemsInCategory.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border transition ${
                            item.status === 'Verified'
                              ? 'bg-green-50/20 border-green-200'
                              : item.status === 'Rejected'
                              ? 'bg-red-50/20 border-red-200'
                              : item.status === 'Uploaded'
                              ? 'bg-blue-50/20 border-blue-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-gray-900">{item.itemName}</span>
                                <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {item.itemCode}
                                </span>
                                {item.isRequired ? (
                                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                    Bắt buộc
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                    Tùy chọn
                                  </span>
                                )}
                              </div>

                              {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}

                              {/* Rejection notice */}
                              {item.status === 'Rejected' && item.rejectionReason && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-1.5">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <strong>Lý do từ chối / yêu cầu sửa đổi:</strong> {item.rejectionReason}
                                  </div>
                                </div>
                              )}

                              {/* Verification signature */}
                              {item.status === 'Verified' && item.verifiedByName && (
                                <div className="text-[11px] text-green-700 mt-1 flex items-center gap-1 font-medium">
                                  <Shield className="w-3.5 h-3.5" />
                                  Đã thẩm định bởi {item.verifiedByName} lúc{' '}
                                  {item.verifiedAtUtc ? new Date(item.verifiedAtUtc).toLocaleString('vi-VN') : ''}
                                </div>
                              )}
                            </div>

                            {/* Item Actions & Status */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {getItemStatusBadge(item.status)}

                              {/* Hidden file input */}
                              <input
                                type="file"
                                ref={(el) => (fileInputRefs.current[item.id] = el)}
                                onChange={(e) => handleFileChange(item.id, e)}
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                              />

                              {/* Upload Button */}
                              <button
                                disabled={uploadDocMutation.isPending}
                                onClick={() => fileInputRefs.current[item.id]?.click()}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                Tải file lên
                              </button>

                              {/* Verify Button */}
                              {['Uploaded', 'Rejected', 'Pending'].includes(item.status) && (
                                <button
                                  disabled={verifyItemMutation.isPending}
                                  onClick={() => handleVerify(item.id, item.rowVersion)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-medium transition"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Thẩm định
                                </button>
                              )}

                              {/* Reject Button */}
                              {item.status !== 'Rejected' && (
                                <button
                                  onClick={() => {
                                    setRejectingItemId(item.id);
                                    setRejectingItemRowVersion(item.rowVersion);
                                    setRejectionReason('');
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium transition"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Từ chối
                                </button>
                              )}

                              {/* Reset Button */}
                              {item.status !== 'Pending' && (
                                <button
                                  disabled={resetItemMutation.isPending}
                                  onClick={() => resetItemMutation.mutate(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                  title="Đặt lại về Chờ bổ sung"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Attached Document Links list */}
                          {item.documentLinks && item.documentLinks.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
                              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                Tệp tin số hóa ({item.documentLinks.length}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {item.documentLinks.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">
                                          {doc.originalFileName || doc.documentTitle}
                                        </div>
                                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5 font-mono">
                                          <span>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                                          <span>•</span>
                                          <span title={`SHA256: ${doc.sha256Checksum}`}>
                                            SHA: {doc.sha256Checksum?.substring(0, 8)}...
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <a
                                      href={studentWorkspaceService.getDocumentDownloadUrl(doc.documentId)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition flex-shrink-0"
                                      title="Tải xuống tệp tin scan"
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-500">
            Hồ sơ tuyển sinh được lưu trữ bảo mật và tuân thủ chính sách Data Scope đa công ty.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Modal: Rejection Reason */}
      {rejectingItemId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h4 className="font-bold text-sm text-red-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Từ chối tài liệu hồ sơ
              </h4>
              <button onClick={() => setRejectingItemId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lý do từ chối / Yêu cầu sửa đổi <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="VD: Bản scan mờ không rõ số CCCD, hoặc sổ tiết kiệm thiếu xác nhận số dư..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItemId(null)}
                  className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={rejectItemMutation.isPending}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                >
                  {rejectItemMutation.isPending ? 'Đang gửi...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Checklist Item */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Bổ sung hạng mục tài liệu visa
              </h4>
              <button onClick={() => setIsAddItemOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddItemSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mã hạng mục *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: JLPT_CERT, TOPIC_CERT, MOTIVATION_LETTER"
                  value={newItem.itemCode}
                  onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên hạng mục tài liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chứng chỉ tiếng Hàn TOPIK 2, Thư nguyện vọng..."
                  value={newItem.itemName}
                  onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phân loại</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="Identity">Giấy tờ nhân thân & Căn cước</option>
                  <option value="Academic">Học bạ, Bằng cấp & Bảng điểm</option>
                  <option value="Financial">Chứng minh tài chính & Sổ tiết kiệm</option>
                  <option value="Medical">Giấy khám sức khỏe & Y tế</option>
                  <option value="Legal">Lý lịch tư pháp & Giấy tờ pháp lý</option>
                  <option value="Other">Hồ sơ bổ trợ khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú hướng dẫn</label>
                <input
                  type="text"
                  placeholder="Yêu cầu công chứng hoặc bản dịch..."
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={newItem.isRequired}
                    onChange={(e) => setNewItem({ ...newItem, isRequired: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  Hạng mục bắt buộc phải nộp
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addChecklistItemMutation.isPending}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  {addChecklistItemMutation.isPending ? 'Đang thêm...' : 'Lưu hạng mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

