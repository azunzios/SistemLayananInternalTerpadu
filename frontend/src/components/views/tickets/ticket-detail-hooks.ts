import { useState } from 'react';
import type {PerbaikanStatus} from '@/types';

export interface DiagnosaForm {
  pemeriksaanFisik: string;
  hasilTesting: string;
  masalahDitemukan: string;
  komponenBermasalah: string;
  tingkatKerusakan: 'ringan' | 'sedang' | 'berat';
  dapatDiperbaiki: 'ya' | 'tidak' | '';
}

export interface CannotRepairForm {
  alasanTidakBisa: string;
  rekomendasiSolusi: string;
  estimasiBiayaBaruJikaDibeli: string;
  catatanTambahan: string;
}

export interface RepairForm {
  rencanaPerbaikan: string;
  estimasiWaktu: string;
  membutuhkanSparepart: boolean;
  daftarSparepart: { nama: string; jumlah: number }[];
}

export interface CompletionForm {
  tindakanDilakukan: string;
  komponenDiganti: string;
  hasilPerbaikan: string;
  saranPerawatan: string;
  catatanTambahan: string;
  fotoBukti: string;
}

// Admin Layanan Dialog States
export const useAdminLayananDialogs = () => {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');

  return {
    showApproveDialog,
    setShowApproveDialog,
    showRejectDialog,
    setShowRejectDialog,
    showAssignDialog,
    setShowAssignDialog,
    rejectReason,
    setRejectReason,
    selectedTechnician,
    setSelectedTechnician,
  };
};

// Teknisi Dialog States
export const useTeknisiDialogs = () => {
  const [showTeknisiAcceptDialog, setShowTeknisiAcceptDialog] = useState(false);
  const [showTeknisiRejectDialog, setShowTeknisiRejectDialog] = useState(false);
  const [estimatedSchedule, setEstimatedSchedule] = useState('');
  const [teknisiRejectReason, setTeknisiRejectReason] = useState('');
  const [showTeknisiCompleteDialog, setShowTeknisiCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  return {
    showTeknisiAcceptDialog,
    setShowTeknisiAcceptDialog,
    showTeknisiRejectDialog,
    setShowTeknisiRejectDialog,
    estimatedSchedule,
    setEstimatedSchedule,
    teknisiRejectReason,
    setTeknisiRejectReason,
    showTeknisiCompleteDialog,
    setShowTeknisiCompleteDialog,
    completionNotes,
    setCompletionNotes,
  };
};

// Diagnosa Dialog States
export const useDiagnosaDialogs = () => {
  const [showDiagnosaDialog, setShowDiagnosaDialog] = useState(false);
  const [showStatusChangeConfirm, setShowStatusChangeConfirm] = useState(false);
  const [diagnosaForm, setDiagnosaForm] = useState<DiagnosaForm>({
    pemeriksaanFisik: '',
    hasilTesting: '',
    masalahDitemukan: '',
    komponenBermasalah: '',
    tingkatKerusakan: 'ringan',
    dapatDiperbaiki: '',
  });
  const [showCannotRepairDialog, setShowCannotRepairDialog] = useState(false);
  const [cannotRepairForm, setCannotRepairForm] = useState<CannotRepairForm>({
    alasanTidakBisa: '',
    rekomendasiSolusi: '',
    estimasiBiayaBaruJikaDibeli: '',
    catatanTambahan: '',
  });
  const [showStartRepairDialog, setShowStartRepairDialog] = useState(false);
  const [repairForm, setRepairForm] = useState<RepairForm>({
    rencanaPerbaikan: '',
    estimasiWaktu: '',
    membutuhkanSparepart: false,
    daftarSparepart: [],
  });
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionForm, setCompletionForm] = useState<CompletionForm>({
    tindakanDilakukan: '',
    komponenDiganti: '',
    hasilPerbaikan: '',
    saranPerawatan: '',
    catatanTambahan: '',
    fotoBukti: '',
  });

  return {
    showDiagnosaDialog,
    setShowDiagnosaDialog,
    showStatusChangeConfirm,
    setShowStatusChangeConfirm,
    diagnosaForm,
    setDiagnosaForm,
    showCannotRepairDialog,
    setShowCannotRepairDialog,
    cannotRepairForm,
    setCannotRepairForm,
    showStartRepairDialog,
    setShowStartRepairDialog,
    repairForm,
    setRepairForm,
    showCompletionDialog,
    setShowCompletionDialog,
    completionForm,
    setCompletionForm,
  };
};

// Work Order Dialog States
export const useWorkOrderDialogs = () => {
  const [showSparepartDialog, setShowSparepartDialog] = useState(false);
  const [workOrderType, setWorkOrderType] = useState<'sparepart' | 'vendor'>('sparepart');
  const [sparepartName, setSparepartName] = useState('');
  const [sparepartDescription, setSparepartDescription] = useState('');
  const [sparepartEstimatedPrice, setSparepartEstimatedPrice] = useState('');
  const [sparepartUrgency, setSparepartUrgency] = useState('normal');

  return {
    showSparepartDialog,
    setShowSparepartDialog,
    workOrderType,
    setWorkOrderType,
    sparepartName,
    setSparepartName,
    sparepartDescription,
    setSparepartDescription,
    sparepartEstimatedPrice,
    setSparepartEstimatedPrice,
    sparepartUrgency,
    setSparepartUrgency,
  };
};

// Progress Dialog States
export const useProgressDialog = () => {
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<PerbaikanStatus>('in_progress');
  const [progressNotes, setProgressNotes] = useState('');

  return {
    showProgressDialog,
    setShowProgressDialog,
    newStatus,
    setNewStatus,
    progressNotes,
    setProgressNotes,
  };
};

// Generic States for Comment
export const useCommentState = () => {
  const [comment, setComment] = useState('');
  return { comment, setComment };
};

// Zoom Review Modal State
export const useZoomReviewModal = () => {
  const [showZoomReviewModal, setShowZoomReviewModal] = useState(false);
  return { showZoomReviewModal, setShowZoomReviewModal };
};

// Combine all dialog states
export const useAllTicketDetailDialogs = () => {
  const admin = useAdminLayananDialogs();
  const teknisi = useTeknisiDialogs();
  const diagnosa = useDiagnosaDialogs();
  const workOrder = useWorkOrderDialogs();
  const progress = useProgressDialog();
  const { comment, setComment } = useCommentState();
  const { showZoomReviewModal, setShowZoomReviewModal } = useZoomReviewModal();

  return {
    ...admin,
    ...teknisi,
    ...diagnosa,
    ...workOrder,
    ...progress,
    comment,
    setComment,
    showZoomReviewModal,
    setShowZoomReviewModal,
  };
};