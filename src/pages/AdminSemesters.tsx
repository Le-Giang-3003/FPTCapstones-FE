import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type {
  SemesterListItemDto,
  SemesterDetailDto,
  SemesterHolidayDto,
  SemesterStatus,
  SemesterSeason,
  LinkGroupsResultDto,
  SemesterMilestoneDto,
  HolidayCascadeResultDto,
  MilestoneType,
  ReviewStatus,
} from '../types';
import { Calendar, Filter, Users, Clock, AlertCircle, Plus, Loader2, RefreshCw, ChevronDown, X, Link2, ChevronLeft, ChevronRight } from 'lucide-react';

// Map ReviewStatus → label + style (inline để có hatched pattern cho Registered + gray cho Draft)
const REVIEW_STATUS_META: Record<ReviewStatus, { label: string; style: React.CSSProperties }> = {
  Draft: {
    label: 'Chưa đăng ký được',
    style: { background: 'rgba(148, 163, 184, 0.15)', color: '#64748b', border: '1px solid rgba(148, 163, 184, 0.3)' },
  },
  Registering: {
    label: 'Đang đăng ký',
    style: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.35)' },
  },
  Registered: {
    label: 'Đã chốt slot',
    // Xanh dương + hatched diagonal bên trong (đục) để phân biệt với Registering
    style: {
      background: 'repeating-linear-gradient(45deg, rgba(59,130,246,0.22) 0px, rgba(59,130,246,0.22) 4px, rgba(59,130,246,0.05) 4px, rgba(59,130,246,0.05) 8px)',
      color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.4)',
    },
  },
  Ongoing: {
    label: 'Đang diễn ra',
    style: { background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' },
  },
  Finished: {
    label: 'Đã xong',
    style: { background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)' },
  },
  Cancelled: {
    label: 'Đã hủy',
    style: { background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' },
  },
};

// Map enum → label tiếng Việt + màu badge

const STATUS_META: Record<SemesterStatus, { label: string; badge: string }> = {
  Pending:   { label: 'Sắp diễn ra', badge: 'badge-info' },
  Ongoing:   { label: 'Đang diễn ra', badge: 'badge-ongoing' },
  Completed: { label: 'Đã kết thúc', badge: 'badge-success' },
  Cancelled: { label: 'Đã hủy',     badge: 'badge-danger' },
};

const SEASON_LABEL: Record<string, string> = {
  Spring: 'Học kỳ Xuân',
  Summer: 'Học kỳ Hè',
  Fall:   'Học kỳ Thu',
};

// Format date dd/MM/yyyy gọn
const fmt = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Format ngắn dd/MM cho tick tuần trên timeline
const fmtShort = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

// Tính số ngày giữa 2 mốc (inclusive ở startDate)
const daysBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

// Gợi ý mốc start/end theo quy ước:
//   Spring bắt đầu 01/01 của năm — Summer = Spring + 16w — Fall = Summer + 16w
//   Mỗi kỳ kéo dài đúng 16 tuần (112 ngày)
const WEEKS_PER_SEMESTER = 16;
const SEASON_INDEX: Record<SemesterSeason, number> = { Spring: 0, Summer: 1, Fall: 2 };

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

// Quy tắc derive status từ ngày: Cancelled giữ nguyên — còn lại auto theo today UTC
const deriveStatus = (
  current: SemesterStatus,
  startDate: string,
  endDate: string,
  today = new Date()
): SemesterStatus => {
  if (current === 'Cancelled') return 'Cancelled';
  const t = today.getTime();
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  if (t > e) return 'Completed';
  if (t >= s) return 'Ongoing';
  return 'Pending';
};

const suggestDates = (season: SemesterSeason, year: number): { start: string; end: string } => {
  // start[Spring] = 1/1/{year} — mỗi kỳ tiếp theo offset thêm 16 tuần
  const yearStart = new Date(`${year}-01-01`);
  const start = addDays(yearStart, SEASON_INDEX[season] * WEEKS_PER_SEMESTER * 7);
  const end = addDays(start, WEEKS_PER_SEMESTER * 7);
  return { start: toISO(start), end: toISO(end) };
};

const AdminSemesters = () => {
  const [list, setList] = useState<SemesterListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SemesterStatus | ''>('');

  // Detail state — load on click
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SemesterDetailDto | null>(null);
  const [holidays, setHolidays] = useState<SemesterHolidayDto[]>([]);
  const [milestones, setMilestones] = useState<SemesterMilestoneDto[]>([]);   // chỉ overlap kỳ hiện tại (dùng cho bảng dưới)
  const [allReviews, setAllReviews] = useState<SemesterMilestoneDto[]>([]);  // toàn bộ review trong DB (dùng cho timeline)
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Timeline view mode: 'week' (1 tick = 1 tuần) hoặc 'month' (1 tick = 1 tháng, ít cột hơn → fit screen)
  const [tlMode, setTlMode] = useState<'week' | 'month'>('week');

  // Modal "Tạo kỳ học mới" — default năm hiện tại, season Fall (vì giữa năm hay tạo Fall tiếp theo)
  const currentYear = new Date().getFullYear();
  const initialForm = { season: 'Fall' as SemesterSeason, year: currentYear, ...suggestDates('Fall', currentYear) };
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Khi đổi Season hoặc Year trong modal → auto fill lại mốc gợi ý
  const updateSeason = (season: SemesterSeason) => {
    setCreateForm(f => ({ ...f, season, ...suggestDates(season, f.year) }));
  };
  const updateYear = (year: number) => {
    setCreateForm(f => ({ ...f, year, ...suggestDates(f.season, year) }));
  };

  // Dropdown đổi status trong detail header
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Holiday đang được hover (để show tooltip)
  const [hoveredHoliday, setHoveredHoliday] = useState<number | null>(null);

  // Năm đang xem trong list semester — default năm hiện tại, có thể navigate ←/→
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());

  // Các năm có dữ liệu trong list (sau khi đã filter status)
  const availableYears = useMemo(() => {
    const s = new Set(list.map(l => l.year));
    return Array.from(s).sort((a, b) => a - b);
  }, [list]);

  // Khi list đổi (filter đổi) — clamp viewYear vào range có dữ liệu, không break trải nghiệm
  useEffect(() => {
    if (availableYears.length === 0) return;
    if (!availableYears.includes(viewYear)) {
      // Nếu năm hiện tại không có dữ liệu → chọn năm gần nhất với năm đó
      const closest = availableYears.reduce((p, c) => Math.abs(c - viewYear) < Math.abs(p - viewYear) ? c : p);
      setViewYear(closest);
    }
  }, [availableYears]);

  // === Drag-to-resize holidays trên timeline ===
  // dirtyEdits: id -> { startDate, durationDays } đã chỉnh tạm thời, chưa lưu BE
  const [dirtyEdits, setDirtyEdits] = useState<Record<number, { startDate: string; durationDays: number }>>({});
  // dragState: holiday đang drag + edge nào + mốc gốc khi bắt đầu
  const [dragState, setDragState] = useState<{
    holidayId: number;
    edge: 'left' | 'right';
    startX: number;
    pxPerDay: number;
    origStart: string;        // ISO yyyy-MM-dd ở thời điểm mousedown
    origDuration: number;
    liveStart: string;        // tracked realtime để hiện tooltip ngày
    liveDuration: number;
  } | null>(null);
  const [savingEdits, setSavingEdits] = useState(false);

  // Helper: cộng X ngày vào ISO date (UTC-safe)
  const addDaysISO = (iso: string, days: number) => {
    const d = new Date(iso);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  // Lấy effective values (ưu tiên dirty edits) — dùng để render timeline & table
  const effective = (h: SemesterHolidayDto) => {
    const e = dirtyEdits[h.id];
    if (dragState && dragState.holidayId === h.id) {
      return { startDate: dragState.liveStart, durationDays: dragState.liveDuration };
    }
    return e ? { startDate: e.startDate, durationDays: e.durationDays } : { startDate: h.startDate, durationDays: h.durationDays };
  };

  const hasDirty = Object.keys(dirtyEdits).length > 0;

  // Mouse handlers cho drag (global vì khi rê có thể ra ngoài element)
  useEffect(() => {
    if (!dragState) return;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragState.startX;
      const deltaDays = Math.round(dx / dragState.pxPerDay);
      if (!detail) return;
      const semStart = detail.startDate.slice(0, 10);
      const semEndISO = detail.endDate.slice(0, 10);

      if (dragState.edge === 'left') {
        // Kéo cạnh trái: dời startDate, duration = origDuration - delta để cạnh phải giữ nguyên
        let newStart = addDaysISO(dragState.origStart, deltaDays);
        let newDuration = dragState.origDuration - deltaDays;
        if (newDuration < 1) { newDuration = 1; newStart = addDaysISO(dragState.origStart, dragState.origDuration - 1); }
        if (newStart < semStart) {
          const diff = Math.round((new Date(semStart).getTime() - new Date(newStart).getTime()) / 86400000);
          newStart = semStart;
          newDuration -= diff;
          if (newDuration < 1) newDuration = 1;
        }
        setDragState({ ...dragState, liveStart: newStart, liveDuration: newDuration });
      } else {
        // Kéo cạnh phải: giữ startDate, đổi duration
        let newDuration = dragState.origDuration + deltaDays;
        if (newDuration < 1) newDuration = 1;
        // Chặn không cho vượt semester end (loose check, BE sẽ recalc)
        const endISO = addDaysISO(dragState.origStart, newDuration);
        if (endISO > semEndISO) {
          const semDays = Math.round((new Date(semEndISO).getTime() - new Date(dragState.origStart).getTime()) / 86400000);
          newDuration = Math.max(1, semDays);
        }
        setDragState({ ...dragState, liveDuration: newDuration });
      }
    };
    const onUp = () => {
      // Commit live values vào dirtyEdits nếu khác bản gốc
      const h = holidays.find(x => x.id === dragState.holidayId);
      if (h) {
        const baselineStart = h.startDate.slice(0, 10);
        const baselineDur = h.durationDays;
        const changed = dragState.liveStart !== baselineStart || dragState.liveDuration !== baselineDur;
        if (changed) {
          setDirtyEdits(prev => ({ ...prev, [dragState.holidayId]: { startDate: dragState.liveStart, durationDays: dragState.liveDuration } }));
        } else {
          // Quay về baseline -> xóa entry dirty (nếu có)
          setDirtyEdits(prev => { const c = { ...prev }; delete c[dragState.holidayId]; return c; });
        }
      }
      setDragState(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragState, detail, holidays]);

  // Lưu các thay đổi drag — PUT từng cái, gộp cascade feedback của cái cuối
  const handleSaveEdits = async () => {
    if (!hasDirty || savingEdits) return;
    try {
      setSavingEdits(true);
      const ids = Object.keys(dirtyEdits).map(n => parseInt(n, 10));
      let lastCascade: HolidayCascadeResultDto | null = null;
      for (const id of ids) {
        const e = dirtyEdits[id];
        const res = await api.put<HolidayCascadeResultDto>(`/api/admin/semester-holidays/${id}`, {
          startDate: e.startDate,
          durationDays: e.durationDays,
        });
        lastCascade = res.data;
      }
      setDirtyEdits({});
      if (detail) await Promise.all([loadDetail(detail.id), loadList()]);
      if (lastCascade) showCascadeFeedback(lastCascade, 'Lưu chỉnh sửa');
    } catch (e: any) {
      openConfirm({
        title: 'Lưu thay đổi thất bại',
        message: e?.response?.data?.message || 'Có lỗi xảy ra khi lưu chỉnh sửa.',
        variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
      });
    } finally {
      setSavingEdits(false);
    }
  };

  // Hủy hết edits — quay về dữ liệu BE
  const handleDiscardEdits = () => setDirtyEdits({});

  // Khi đổi semester được chọn -> reset dirty (tránh nhầm giữa các kỳ)
  useEffect(() => { setDirtyEdits({}); }, [selectedId]);

  // === Modal "Thêm ngày nghỉ vào kỳ" ===
  // Khi user pick template, ta clone template values nhưng cho phép override
  // (StartDate được suy từ Year của semester + DefaultStartMonth/Day — clamp >= semester.startDate)
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const blankHolidayForm = {
    templateId: null as number | null,
    label: '',
    startDate: '',
    durationDays: 1,
    isCompensated: true,
  };
  const [holidayForm, setHolidayForm] = useState(blankHolidayForm);
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [addingHoliday, setAddingHoliday] = useState(false);

  const openAddHoliday = () => {
    setHolidayError(null);
    setHolidayForm({ ...blankHolidayForm });
    setShowAddHoliday(true);
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolidayError(null);
    if (!detail) return;
    if (!holidayForm.label.trim()) {
      setHolidayError('Tên ngày nghỉ không được rỗng');
      return;
    }
    if (!holidayForm.startDate) {
      setHolidayError('Phải chọn ngày bắt đầu');
      return;
    }
    if (new Date(holidayForm.startDate) < new Date(detail.startDate)) {
      setHolidayError('Ngày bắt đầu phải >= ngày bắt đầu của kỳ học');
      return;
    }
    if (new Date(holidayForm.startDate) > new Date(detail.endDate)) {
      setHolidayError('Ngày bắt đầu phải <= ngày kết thúc của kỳ học');
      return;
    }
    if (holidayForm.durationDays < 1) {
      setHolidayError('Số ngày nghỉ phải >= 1');
      return;
    }
    try {
      setAddingHoliday(true);
      const res = await api.post<HolidayCascadeResultDto>('/api/admin/semester-holidays', {
        semesterId: detail.id,
        templateId: holidayForm.templateId,
        label: holidayForm.label.trim(),
        startDate: holidayForm.startDate,
        durationDays: holidayForm.durationDays,
        isCompensated: holidayForm.isCompensated,
      });
      setShowAddHoliday(false);
      await Promise.all([loadDetail(detail.id), loadList()]);  // loadList vì EndDate có thể đổi (auto-recalc)
      // Show cascade feedback nếu có gì shift
      showCascadeFeedback(res.data, 'Thêm ngày nghỉ');
    } catch (err: any) {
      setHolidayError(err?.response?.data?.message || 'Thêm ngày nghỉ thất bại');
    } finally {
      setAddingHoliday(false);
    }
  };

  // === Xóa học kỳ ===
  const [deletingSem, setDeletingSem] = useState(false);
  const handleDeleteSemester = () => {
    if (!detail) return;
    openConfirm({
      title: `Xóa kỳ học ${detail.code}?`,
      message: `Sẽ xóa kỳ "${SEASON_LABEL[detail.season] ?? detail.season} ${detail.year}" cùng toàn bộ ngày nghỉ và lịch review/defence của kỳ này. ${detail.groupCount > 0 ? `⚠️ Kỳ này đang có ${detail.groupCount} nhóm — BE sẽ chặn xóa.` : 'Không có nhóm gắn vào nên xóa được.'}`,
      variant: 'danger', confirmLabel: 'Xóa kỳ học',
      onConfirm: async () => {
        try {
          setDeletingSem(true);
          await api.delete(`/api/admin/semesters/${detail.id}`);
          setSelectedId(null);
          setDetail(null);
          setHolidays([]);
          setMilestones([]);
          await loadList();
        } catch (e: any) {
          openConfirm({
            title: 'Xóa kỳ thất bại',
            message: e?.response?.data?.message || 'Có lỗi xảy ra. Có thể kỳ này đang có nhóm gắn vào.',
            variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
          });
        } finally {
          setDeletingSem(false);
        }
      },
    });
  };

  // === Milestone CRUD (manual) ===
  // Modal mode: 'new' = tạo mới, số = sửa id
  const [milestoneMode, setMilestoneMode] = useState<number | 'new' | null>(null);
  const blankMilestoneForm = {
    type: 'Review' as MilestoneType,
    orderIndex: 1,
    label: '',
    windowStart: '',
    windowEnd: '',
    status: 'Draft' as ReviewStatus,
    note: '',
  };
  const [milestoneForm, setMilestoneForm] = useState(blankMilestoneForm);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);
  const [savingMs, setSavingMs] = useState(false);

  // Realtime preview cho timeline: project form values lên timeline ngay khi user gõ
  const previewHoliday = useMemo(() => {
    if (!showAddHoliday || !holidayForm.startDate || holidayForm.durationDays < 1) return null;
    return {
      label: holidayForm.label || '(Lễ mới)',
      startDate: holidayForm.startDate,
      durationDays: holidayForm.durationDays,
      isCompensated: holidayForm.isCompensated,
    };
  }, [showAddHoliday, holidayForm]);

  const previewMilestone = useMemo(() => {
    if (milestoneMode === null || !milestoneForm.windowStart || !milestoneForm.windowEnd) return null;
    if (new Date(milestoneForm.windowEnd) <= new Date(milestoneForm.windowStart)) return null;
    return {
      type: milestoneForm.type,
      label: milestoneForm.label || `(${milestoneForm.type} mới)`,
      windowStart: milestoneForm.windowStart,
      windowEnd: milestoneForm.windowEnd,
      // Edit mode: bỏ milestone gốc đang sửa để preview thay nó (không render trùng)
      hiddenId: typeof milestoneMode === 'number' ? milestoneMode : null,
    };
  }, [milestoneMode, milestoneForm]);

  const openCreateMilestone = () => {
    if (!detail) return;
    // Auto-suggest OrderIndex tiếp theo cho Review
    const nextRvIdx = (milestones.filter(m => m.type === 'Review').map(m => m.orderIndex).reduce((a, b) => Math.max(a, b), 0)) + 1;
    setMilestoneForm({
      ...blankMilestoneForm,
      type: 'Review',
      orderIndex: nextRvIdx,
      label: `Review ${nextRvIdx}`,
      windowStart: detail.startDate.slice(0, 10),
      windowEnd: addDaysISO(detail.startDate.slice(0, 10), 14),
    });
    setMilestoneError(null);
    setMilestoneMode('new');
  };

  const openEditMilestone = (m: SemesterMilestoneDto) => {
    setMilestoneForm({
      type: m.type,
      orderIndex: m.orderIndex,
      label: m.label,
      windowStart: m.windowStart.slice(0, 10),
      windowEnd: m.windowEnd.slice(0, 10),
      status: m.status ?? 'Draft',
      note: m.note ?? '',
    });
    setMilestoneError(null);
    setMilestoneMode(m.id);
  };

  // Khi đổi Type trong form, auto re-suggest OrderIndex + Label
  const onTypeChange = (newType: MilestoneType) => {
    if (milestoneMode !== 'new') {                              // Edit thì không auto đổi
      setMilestoneForm(f => ({ ...f, type: newType }));
      return;
    }
    const nextIdx = (milestones.filter(m => m.type === newType).map(m => m.orderIndex).reduce((a, b) => Math.max(a, b), 0)) + 1;
    setMilestoneForm(f => ({ ...f, type: newType, orderIndex: nextIdx, label: `${newType === 'Review' ? 'Review' : 'Defence'} ${nextIdx}` }));
  };

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setMilestoneError(null);
    if (!detail) return;
    if (!milestoneForm.label.trim()) { setMilestoneError('Label không được rỗng'); return; }
    if (!milestoneForm.windowStart || !milestoneForm.windowEnd) { setMilestoneError('Phải nhập cả 2 mốc'); return; }
    if (new Date(milestoneForm.windowEnd) <= new Date(milestoneForm.windowStart)) { setMilestoneError('WindowEnd phải sau WindowStart'); return; }
    if (new Date(milestoneForm.windowStart) < new Date(detail.startDate)) { setMilestoneError('WindowStart phải >= ngày bắt đầu kỳ'); return; }
    try {
      setSavingMs(true);
      if (milestoneMode === 'new') {
        await api.post('/api/admin/reviews', {
          semesterId: detail.id,
          type: milestoneForm.type,
          orderIndex: milestoneForm.orderIndex,
          label: milestoneForm.label.trim(),
          windowStart: milestoneForm.windowStart,
          windowEnd: milestoneForm.windowEnd,
          status: milestoneForm.status,
          note: milestoneForm.note.trim() || null,
        });
      } else {
        await api.put(`/api/admin/reviews/${milestoneMode}`, {
          label: milestoneForm.label.trim(),
          windowStart: milestoneForm.windowStart,
          windowEnd: milestoneForm.windowEnd,
          status: milestoneForm.status,
          note: milestoneForm.note.trim() || null,
        });
      }
      setMilestoneMode(null);
      await loadDetail(detail.id);
    } catch (err: any) {
      setMilestoneError(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSavingMs(false);
    }
  };

  // Chuyển status nhanh qua PATCH (Draft → Registering, etc.)
  const handleChangeReviewStatus = async (m: SemesterMilestoneDto, newStatus: ReviewStatus) => {
    if (!detail) return;
    try {
      await api.patch(`/api/admin/reviews/${m.id}/status`, { status: newStatus });
      await loadDetail(detail.id);
    } catch (e: any) {
      openConfirm({
        title: 'Đổi trạng thái thất bại',
        message: e?.response?.data?.message || 'Có lỗi xảy ra.',
        variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
      });
    }
  };

  const handleDeleteMilestone = (m: SemesterMilestoneDto) => {
    openConfirm({
      title: 'Xóa lịch review/defence?',
      message: `Xóa "${m.label}" khỏi kỳ học. Hành động này không undo được.`,
      variant: 'danger', confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/reviews/${m.id}`);
          if (detail) await loadDetail(detail.id);
        } catch (e: any) {
          openConfirm({
            title: 'Xóa thất bại',
            message: e?.response?.data?.message || 'Có lỗi xảy ra.',
            variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
          });
        }
      },
    });
  };

  // Xóa 1 holiday — confirm qua popup
  const handleDeleteHoliday = (h: SemesterHolidayDto) => {
    openConfirm({
      title: 'Xóa ngày nghỉ?',
      message: `Bỏ "${h.label}" khỏi kỳ học này. EndDate kỳ học có thể được tính lại nếu lễ có bù.`,
      variant: 'danger',
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          const res = await api.delete<HolidayCascadeResultDto>(`/api/admin/semester-holidays/${h.id}`);
          if (detail) await Promise.all([loadDetail(detail.id), loadList()]);
          if (res.data) showCascadeFeedback(res.data, 'Xóa ngày nghỉ');
        } catch (e: any) {
          openConfirm({
            title: 'Xóa thất bại',
            message: e?.response?.data?.message || 'Có lỗi xảy ra.',
            variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
          });
        }
      },
    });
  };

  // Confirm popup state (thay cho window.confirm + alert) — 1 modal dùng chung
  type ConfirmVariant = 'warning' | 'danger' | 'info';
  interface ConfirmState {
    title: string;
    message: string;
    lines?: string[];                   // optional list để liệt kê (vd thay đổi sync)
    confirmLabel?: string;
    cancelLabel?: string | null;       // null = ẩn nút Hủy (mode info-only)
    variant?: ConfirmVariant;
    onConfirm?: () => void | Promise<void>;
  }
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Show popup từ cascade result (sau khi thêm/sửa/xóa lễ có bù) — chỉ show khi có gì đó shift
  const showCascadeFeedback = (r: HolidayCascadeResultDto, actionLabel: string) => {
    if (r.shiftedSemesters.length === 0 && r.shiftedMilestones.length === 0 && r.overflows.length === 0) return;
    const lines: string[] = [];
    if (r.shiftedSemesters.length > 0) {
      lines.push(`── ${r.shiftedSemesters.length} kỳ học bị shift:`);
      r.shiftedSemesters.forEach(s => lines.push(`  ${s.code}: ${s.oldStart.slice(0, 10)} → ${s.newStart.slice(0, 10)} (+${s.deltaDays}d)`));
    }
    if (r.shiftedMilestones.length > 0) {
      lines.push(`── ${r.shiftedMilestones.length} milestone bị shift:`);
      r.shiftedMilestones.forEach(m => lines.push(`  ${m.label}: ${m.oldWindowStart.slice(0, 10)}→${m.oldWindowEnd.slice(0, 10)} ⇒ ${m.newWindowStart.slice(0, 10)}→${m.newWindowEnd.slice(0, 10)}`));
    }
    if (r.overflows.length > 0) {
      lines.push(`── ⚠ ${r.overflows.length} mục vắt biên kỳ:`);
      r.overflows.forEach(o => lines.push(`  ${o.kind} "${o.label}" trong ${o.semesterCode} vượt ${o.overflowDays} ngày`));
    }
    if (r.skippedCompletedCodes.length > 0) {
      lines.push(`── Bỏ qua (kỳ đã Completed, không shift):`);
      r.skippedCompletedCodes.forEach(c => lines.push(`  ${c}`));
    }
    setConfirmState({
      title: `${actionLabel} thành công — đã cascade`,
      message: `Sau thao tác này hệ thống đã tự cập nhật các kỳ học và milestone liên quan:`,
      lines,
      variant: 'info', cancelLabel: null, confirmLabel: 'Đã hiểu',
    });
  };

  const openConfirm = (state: ConfirmState) => setConfirmState(state);
  const closeConfirm = () => { if (!confirmBusy) setConfirmState(null); };
  const runConfirm = async () => {
    if (!confirmState?.onConfirm) { setConfirmState(null); return; }
    try {
      setConfirmBusy(true);
      await confirmState.onConfirm();
      setConfirmState(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  // PUT status cho 1 semester, optional refresh detail sau cùng
  const putStatus = async (id: number, status: SemesterStatus) => {
    await api.put(`/api/admin/semesters/${id}`, { status });
  };

  // Đổi status từ dropdown — enforce "chỉ 1 Ongoing"
  const handleChangeStatus = async (newStatus: SemesterStatus) => {
    if (!detail || updatingStatus) return;
    setStatusMenuOpen(false);
    if (newStatus === detail.status) return;

    // Nếu chọn Ongoing mà đã có kỳ khác đang Ongoing → popup confirm
    if (newStatus === 'Ongoing') {
      const other = list.find(s => s.id !== detail.id && s.status === 'Ongoing');
      if (other) {
        openConfirm({
          title: 'Chuyển kỳ học đang Ongoing?',
          message:
            `Hiện kỳ "${SEASON_LABEL[other.season]} ${other.year}" (${other.code}) đang Ongoing.\n` +
    `Hệ thống chỉ cho phép 1 kỳ Ongoing cùng lúc.\n` +
    `Chuyển học kỳ (${other.code}) về Completed.`,
          confirmLabel: 'Đồng ý chuyển',
          variant: 'warning',
          onConfirm: async () => {
            setUpdatingStatus(true);
            try {
              await putStatus(other.id, 'Completed');
              await putStatus(detail.id, newStatus);
              await Promise.all([loadList(), loadDetail(detail.id)]);
            } catch (e: any) {
              openConfirm({
                title: 'Cập nhật thất bại',
                message: e?.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái.',
                variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
              });
            } finally {
              setUpdatingStatus(false);
            }
          },
        });
        return;
      }
    }

    try {
      setUpdatingStatus(true);
      await putStatus(detail.id, newStatus);
      await Promise.all([loadList(), loadDetail(detail.id)]);
    } catch (e: any) {
      openConfirm({
        title: 'Cập nhật thất bại',
        message: e?.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái.',
        variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Nút "Đồng bộ nhóm" — gọi BE backfill SemesterId cho group dựa trên GroupCode (vd GSU26SE02 -> SU26)
  const [linking, setLinking] = useState(false);
  const handleLinkGroups = async () => {
    if (linking) return;
    try {
      setLinking(true);
      const res = await api.post<LinkGroupsResultDto>('/api/admin/semesters/link-groups', {});
      const r = res.data;
      // Show kết quả qua popup
      if (r.totalUnlinked === 0) {
        openConfirm({
          title: 'Không có gì để đồng bộ',
          message: 'Tất cả nhóm đã được nối với học kỳ.',
          variant: 'info', cancelLabel: null, confirmLabel: 'OK',
        });
      } else {
        openConfirm({
          title: `Đồng bộ xong (${r.linked}/${r.totalUnlinked} nhóm)`,
          message: r.skipped > 0
            ? `Đã nối ${r.linked} nhóm. ${r.skipped} nhóm bị bỏ qua do không tìm thấy học kỳ tương ứng (có thể chưa tạo học kỳ đó, hoặc kỳ đã Cancelled).`
            : `Đã nối thành công ${r.linked} nhóm với học kỳ tương ứng.`,
          lines: r.skipped > 0 ? r.skippedGroups.slice(0, 20).map(c => `Skip: ${c}`) : undefined,
          variant: r.skipped > 0 ? 'warning' : 'info',
          cancelLabel: null, confirmLabel: 'OK',
        });
        // Refresh list (groupCount của các kỳ sẽ tăng)
        await loadList();
        if (selectedId !== null) await loadDetail(selectedId);
      }
    } catch (e: any) {
      openConfirm({
        title: 'Đồng bộ nhóm thất bại',
        message: e?.response?.data?.message || 'Có lỗi xảy ra khi gọi API link-groups.',
        variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
      });
    } finally {
      setLinking(false);
    }
  };

  // Nút "Đồng bộ theo ngày" — quét list, PUT những kỳ có status chưa khớp
  const [syncing, setSyncing] = useState(false);
  const handleSyncByDate = async () => {
    if (list.length === 0 || syncing) return;
    const today = new Date();
    const diffs = list
      .map(s => ({ s, desired: deriveStatus(s.status, s.startDate, s.endDate, today) }))
      .filter(x => x.desired !== x.s.status);

    if (diffs.length === 0) {
      openConfirm({
        title: 'Đã đồng bộ',
        message: 'Tất cả kỳ đã đúng trạng thái theo ngày hiện tại.',
        variant: 'info', cancelLabel: null, confirmLabel: 'OK',
      });
      return;
    }
    openConfirm({
      title: `Đồng bộ ${diffs.length} kỳ học theo ngày?`,
      message: 'Các kỳ sau sẽ được cập nhật trạng thái:',
      lines: diffs.map(d => `${d.s.code}: ${STATUS_META[d.s.status].label} → ${STATUS_META[d.desired].label}`),
      confirmLabel: 'Đồng bộ ngay',
      variant: 'warning',
      onConfirm: async () => {
        setSyncing(true);
        try {
          for (const d of diffs) await putStatus(d.s.id, d.desired);
          await loadList();
          if (selectedId !== null) await loadDetail(selectedId);
        } catch (e: any) {
          openConfirm({
            title: 'Đồng bộ thất bại',
            message: e?.response?.data?.message || 'Có lỗi xảy ra khi đồng bộ.',
            variant: 'danger', cancelLabel: null, confirmLabel: 'Đã hiểu',
          });
        } finally {
          setSyncing(false);
        }
      },
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (new Date(createForm.end) <= new Date(createForm.start)) {
      setCreateError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }
    try {
      setSaving(true);
      await api.post('/api/admin/semesters', {
        season: createForm.season,
        year: createForm.year,
        startDate: createForm.start,
        endDate: createForm.end,
      });
      setShowCreate(false);
      setCreateForm(initialForm);
      await loadList();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Tạo kỳ học thất bại');
    } finally {
      setSaving(false);
    }
  };

  // Load list semester (có filter status)
  const loadList = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: 1, pageSize: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<SemesterListItemDto[]>('/api/admin/semesters', { params });
      setList(res.data);
      // Auto-select học kỳ đang diễn ra nếu có, fallback về item đầu.
      const selectedExists = selectedId !== null && res.data.some(s => s.id === selectedId);
      if (res.data.length > 0 && !selectedExists) {
        const ongoing = res.data.find(s => s.status === 'Ongoing');
        const target = ongoing ?? res.data[0];
        setSelectedId(target.id);
        setViewYear(target.year);
      }
    } catch (e) {
      console.error('Load semesters failed', e);
    } finally {
      setLoading(false);
    }
  };

  // Load detail + holidays + milestones cho semester được chọn (parallel)
  const loadDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      // 4 fetch parallel: detail / holidays / reviews-overlap (bảng) / all-reviews (timeline)
      const [d, h, m, allR] = await Promise.all([
        api.get<SemesterDetailDto>(`/api/admin/semesters/${id}`),
        api.get<SemesterHolidayDto[]>(`/api/admin/semester-holidays`, { params: { semesterId: id } }),
        api.get<SemesterMilestoneDto[]>(`/api/admin/reviews`, { params: { semesterId: id } }),
        api.get<SemesterMilestoneDto[]>(`/api/admin/reviews/all`),
      ]);
      setDetail(d.data);
      setHolidays(h.data);
      setMilestones(m.data);
      setAllReviews(allR.data);
    } catch (e) {
      console.error('Load semester detail failed', e);
      setDetail(null);
      setHolidays([]);
      setMilestones([]);
      setAllReviews([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => { loadList(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter]);
  useEffect(() => { if (selectedId !== null) loadDetail(selectedId); }, [selectedId]);

  // Tính số tuần của semester (rounded up)
  const weekCount = useMemo(() => {
    if (!detail) return 0;
    return Math.ceil(daysBetween(detail.startDate, detail.endDate) / 7);
  }, [detail]);

  // (Đã refactor: tính displayDays trong IIFE timeline, không cần totalDays toàn cục nữa)

  return (
    <div className="animate-fade-in">
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
      <div className="topbar">
        <div>
          <h1>Lịch trình học kỳ</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Xem các kỳ học, mốc thời gian và ngày nghỉ</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleLinkGroups}
            disabled={linking}
            title="Nối các nhóm chưa có học kỳ — parse GroupCode (vd GSU26SE02 → SU26) để match Semester.Code"
          >
            {linking ? <Loader2 size={16} className="spin" /> : <Link2 size={16} />}
            {linking ? 'Đang nối...' : 'Đồng bộ nhóm'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleSyncByDate}
            disabled={syncing || list.length === 0}
            title="Quét tất cả kỳ học, tự áp trạng thái theo ngày hiện tại (Cancelled giữ nguyên)"
          >
            {syncing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ theo ngày'}
          </button>
          <button className="btn btn-primary" onClick={() => { setCreateError(null); setShowCreate(true); }}>
            <Plus size={16} /> Tạo kỳ học mới
          </button>
        </div>
      </div>

      {/* Filter + Horizontal list semester (group by year, divider mỗi năm) */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Filter size={14} /> Lọc trạng thái
          </div>
          <select
            className="input-field"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as SemesterStatus | '')}
            style={{ width: 'auto', minWidth: 180, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="">Tất cả</option>
            <option value="Pending">Sắp diễn ra</option>
            <option value="Ongoing">Đang diễn ra</option>
            <option value="Completed">Đã kết thúc</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Đang tải...</div>
        ) : list.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Không có kỳ học nào.</div>
        ) : (() => {
          // Chỉ hiển thị semester của viewYear
          const filteredItems = list.filter(s => s.year === viewYear);
          // Pos của viewYear trong availableYears để biết có disable prev/next không
          const idx = availableYears.indexOf(viewYear);
          const hasPrev = idx > 0;
          const hasNext = idx >= 0 && idx < availableYears.length - 1;
          const goPrev = () => hasPrev && setViewYear(availableYears[idx - 1]);
          const goNext = () => hasNext && setViewYear(availableYears[idx + 1]);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {/* Mũi tên ← */}
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                title={hasPrev ? `Xem năm ${availableYears[idx - 1]}` : 'Không có năm trước'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid var(--border-glass)',
                  background: 'transparent',
                  color: hasPrev ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: hasPrev ? 'pointer' : 'not-allowed',
                  opacity: hasPrev ? 1 : 0.35,
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={18} />
              </button>

              {/* Nhãn năm hiện tại */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingRight: '0.85rem', borderRight: '2px solid var(--border-glass)',
                minWidth: 72, flexShrink: 0,
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>
                  {viewYear}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {filteredItems.length} kỳ
                </span>
              </div>

              {/* Pills của các kỳ trong năm */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                {filteredItems.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                    Không có kỳ học nào trong năm {viewYear}.
                  </div>
                ) : (() => {
                  // list is sorted desc by Year+Season upstream; for display we want chronological order within the year
                  const displayItems = filteredItems.slice().reverse();
                  return displayItems.map(s => {
                  const isActive = s.id === selectedId;
                  const meta = STATUS_META[s.status];
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '10px',
                        border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                        background: isActive ? 'rgba(251, 146, 60, 0.12)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                      }}
                      title={`${fmt(s.startDate)} → ${fmt(s.endDate)} · ${s.groupCount} nhóm`}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.code}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {SEASON_LABEL[s.season] ?? s.season}
                      </span>
                      <span className={`badge ${meta.badge}`} style={{ padding: '0.05rem 0.45rem', fontSize: '0.65rem' }}>{meta.label}</span>
                    </button>
                  );
                  })
                })()}
              </div>

              {/* Mũi tên → */}
              <button
                onClick={goNext}
                disabled={!hasNext}
                title={hasNext ? `Xem năm ${availableYears[idx + 1]}` : 'Không có năm sau'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid var(--border-glass)',
                  background: 'transparent',
                  color: hasNext ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: hasNext ? 'pointer' : 'not-allowed',
                  opacity: hasNext ? 1 : 0.35,
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          );
        })()}
      </div>

      {/* Detail + timeline — full width */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loadingDetail || !detail ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {loadingDetail ? 'Đang tải chi tiết...' : 'Chọn 1 kỳ học để xem chi tiết'}
            </div>
          ) : (
            <>
              {/* Header card */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>
                      {SEASON_LABEL[detail.season] ?? detail.season} {detail.year}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>Mã: {detail.code}</p>
                  </div>
                  {/* Action group: nút Xóa kỳ + Dropdown đổi trạng thái */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={handleDeleteSemester}
                      disabled={deletingSem}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem',
                        color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)',
                      }}
                      title="Xóa kỳ học này"
                    >
                      {deletingSem ? <Loader2 size={12} className="spin" /> : <X size={12} />}
                      Xóa kỳ
                    </button>
                    <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setStatusMenuOpen(o => !o)}
                      disabled={updatingStatus}
                      className={`badge ${STATUS_META[detail.status].badge}`}
                      style={{
                        cursor: 'pointer', border: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                      }}
                      title="Đổi trạng thái"
                    >
                      {updatingStatus ? <Loader2 size={12} className="spin" /> : null}
                      {STATUS_META[detail.status].label}
                      <ChevronDown size={12} style={{ transform: statusMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {statusMenuOpen && (
                      <>
                        {/* Backdrop click-outside */}
                        <div
                          onClick={() => setStatusMenuOpen(false)}
                          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                        />
                        <div className="glass-panel animate-fade-in" style={{
                          position: 'absolute', top: 'calc(100% + 0.4rem)', right: 0,
                          width: '200px', padding: '0.5rem', zIndex: 60,
                          display: 'flex', flexDirection: 'column', gap: '0.25rem',
                        }}>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem 0.5rem' }}>
                            Đổi trạng thái sang:
                          </p>
                          {(['Pending', 'Ongoing', 'Completed', 'Cancelled'] as SemesterStatus[]).map(st => {
                            const isCurrent = st === detail.status;
                            return (
                              <button
                                key={st}
                                onClick={() => handleChangeStatus(st)}
                                disabled={isCurrent}
                                style={{
                                  padding: '0.5rem 0.75rem', textAlign: 'left',
                                  borderRadius: '6px', border: 'none',
                                  background: isCurrent ? 'var(--surface-glass)' : 'transparent',
                                  color: isCurrent ? 'var(--text-secondary)' : 'var(--text-primary)',
                                  cursor: isCurrent ? 'default' : 'pointer',
                                  fontSize: '0.85rem',
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}
                                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(251, 146, 60, 0.08)'; }}
                                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <span className={`badge ${STATUS_META[st].badge}`} style={{ padding: '0.05rem 0.4rem', fontSize: '0.65rem' }}>
                                  {STATUS_META[st].label}
                                </span>
                                {isCurrent && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓ hiện tại</span>}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  </div>{/* close action group */}
                </div>

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                  <Stat icon={<Calendar size={16} />} label="Bắt đầu" value={fmt(detail.startDate)} />
                  <Stat icon={<Calendar size={16} />} label="Kết thúc" value={fmt(detail.endDate)} />
                  <Stat icon={<Clock size={16} />} label="Số tuần" value={`${weekCount} tuần`} />
                  <Stat icon={<Users size={16} />} label="Số nhóm" value={`${detail.groupCount}`} />
                </div>
              </div>

              {/* Timeline chia theo tuần */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Trục thời gian (theo {tlMode === 'week' ? 'tuần' : 'tháng'})</h3>
                  {/* Toggle Week / Month — gọn hơn, fit screen */}
                  <div style={{ display: 'inline-flex', border: '1px solid var(--border-glass)', borderRadius: 8, overflow: 'hidden' }}>
                    {(['week', 'month'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setTlMode(mode)}
                        style={{
                          padding: '0.35rem 0.85rem', fontSize: '0.8rem',
                          background: tlMode === mode ? 'var(--accent-primary)' : 'transparent',
                          color: tlMode === mode ? 'white' : 'var(--text-secondary)',
                          border: 'none', cursor: 'pointer', transition: 'background 0.05s',
                        }}
                      >
                        {mode === 'week' ? 'Tuần' : 'Tháng'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Container có scroll ngang nếu nhiều tuần */}
                <div style={{ overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  {(() => {
                    // === Tìm kỳ trước & sau (chỉ ở mode 'month' để có context không gian rộng hơn) ===
                    // list đã sort desc(Year+Season) -> prev (lùi thời gian) ở idx+1, next (tiến) ở idx-1
                    const showAdjacent = tlMode === 'month';
                    const idx = showAdjacent ? list.findIndex(s => s.id === detail.id) : -1;
                    const prevSem = showAdjacent && idx >= 0 ? list[idx + 1] : null;     // kỳ liền trước trong thời gian
                    const nextSem = showAdjacent && idx >= 0 ? list[idx - 1] : null;     // kỳ liền sau trong thời gian
                    const semStartISO = detail.startDate;
                    const semEndISO = detail.endDate;

                    // === Display range: trải rộng nếu có prev/next ===
                    const displayStart = prevSem ? new Date(prevSem.startDate) : new Date(semStartISO);
                    const displayEnd = nextSem ? new Date(nextSem.endDate) : new Date(semEndISO);
                    const displayDays = Math.max(1, daysBetween(displayStart.toISOString().slice(0,10), displayEnd.toISOString().slice(0,10)) + 1);
                    const today = new Date();
                    const todayLabel = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const todayOffset = (today.getTime() - displayStart.getTime()) / 86400000;
                    const todayLeftPct = (todayOffset / displayDays) * 100;

                    // Helper tính %left và %width cho 1 segment dựa trên 2 mốc ISO
                    const segPct = (sISO: string, eISO: string) => {
                      const sOffset = daysBetween(displayStart.toISOString().slice(0, 10), sISO.slice(0, 10));
                      const eOffset = daysBetween(displayStart.toISOString().slice(0, 10), eISO.slice(0, 10));
                      return { leftPct: (sOffset / displayDays) * 100, widthPct: ((eOffset - sOffset) / displayDays) * 100 };
                    };

                    // === Tick generation theo mode ===
                    // 'week': mỗi 7 ngày 1 tick, label = dd/MM
                    // 'month': mỗi tháng 1 tick (đầu tháng đầu tiên trong kỳ), label = MM/YYYY — ít cột, fit screen
                    let ticks: Date[];
                    let tickLabelFn: (d: Date) => string;
                    let MIN_COL: number;
                    if (tlMode === 'week') {
                      const wc = Math.ceil(displayDays / 7);
                      ticks = Array.from({ length: wc }, (_, i) => new Date(displayStart.getTime() + i * 7 * 86400000));
                      tickLabelFn = (d) => fmtShort(d);
                      MIN_COL = 70;
                    } else {
                      const ms: Date[] = [];
                      let cur = new Date(displayStart.getFullYear(), displayStart.getMonth(), 1);
                      while (cur <= displayEnd) { ms.push(new Date(cur)); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }
                      ticks = ms;
                      tickLabelFn = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      MIN_COL = 100;
                    }
                    const tickCount = ticks.length;
                    const trackWidth = Math.max(tickCount * MIN_COL, 600);
                    const pxPerDay = trackWidth / displayDays;

                    // Helper tính %left và %width cho 1 item, clip 0-100
                    const positionItem = (itemStart: string, itemDurationDays: number) => {
                      const startOffset = daysBetween(displayStart.toISOString().slice(0,10), itemStart.slice(0,10));
                      const endOffset = startOffset + itemDurationDays;
                      const clippedStart = Math.max(0, startOffset);
                      const clippedEnd = Math.min(displayDays, endOffset);
                      if (clippedEnd <= clippedStart) return null;   // ngoài range
                      const leftPct = (clippedStart / displayDays) * 100;
                      const widthPct = Math.max(0.8, ((clippedEnd - clippedStart) / displayDays) * 100);
                      return { leftPct, widthPct, isClippedLeft: startOffset < 0, isClippedRight: endOffset > displayDays };
                    };

                    return (
                      <div style={{ minWidth: trackWidth, position: 'relative' }}>
                        {/* === LANE 1: HOLIDAY === */}
                        <div style={{ position: 'relative', height: '52px', background: 'var(--surface-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)', overflow: 'visible' }}>
                          {todayLeftPct >= 0 && todayLeftPct <= 100 && (
                            <div
                              title={`Hôm nay: ${todayLabel}`}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                bottom: '4px',
                                left: `${todayLeftPct}%`,
                                width: 0,
                                borderLeft: '2px dashed rgba(59, 130, 246, 0.95)',
                                zIndex: 20,
                                pointerEvents: 'none',
                                boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.12)',
                              }}
                            />
                          )}
                          {/* Segment kỳ trước (xám mờ) — chỉ ở mode 'month' */}
                          {prevSem && (() => {
                            const p = segPct(prevSem.startDate, prevSem.endDate);
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'linear-gradient(90deg, rgba(148,163,184,0.18), rgba(148,163,184,0.28))',
                                borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600,
                                pointerEvents: 'none',
                              }}>
                                ← {prevSem.code}
                              </div>
                            );
                          })()}
                          {/* Segment kỳ hiện tại (cam) */}
                          {(() => {
                            const p = segPct(semStartISO, semEndISO);
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'linear-gradient(90deg, rgba(251, 146, 60, 0.18), rgba(251, 146, 60, 0.32))',
                              }} />
                            );
                          })()}
                          {/* Segment kỳ sau (xám mờ) */}
                          {nextSem && (() => {
                            const p = segPct(nextSem.startDate, nextSem.endDate);
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'linear-gradient(90deg, rgba(148,163,184,0.18), rgba(148,163,184,0.28))',
                                borderTopRightRadius: 8, borderBottomRightRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600,
                                pointerEvents: 'none',
                              }}>
                                {nextSem.code} →
                              </div>
                            );
                          })()}
                          {/* GAP indicator: giữa prev & current */}
                          {prevSem && new Date(prevSem.endDate) < new Date(semStartISO) && (() => {
                            const p = segPct(prevSem.endDate, semStartISO);
                            if (p.widthPct < 0.5) return null;
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.08) 0px, rgba(239,68,68,0.08) 6px, transparent 6px, transparent 12px)',
                                border: '1px dashed rgba(239,68,68,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.62rem', color: 'var(--danger)', fontWeight: 700,
                                pointerEvents: 'none',
                              }} title={`Gap ${daysBetween(prevSem.endDate.slice(0,10), semStartISO.slice(0,10))} ngày giữa ${prevSem.code} và ${detail.code}`}>
                                {p.widthPct > 3 ? `gap ${daysBetween(prevSem.endDate.slice(0,10), semStartISO.slice(0,10))}d` : ''}
                              </div>
                            );
                          })()}
                          {/* GAP indicator: giữa current & next */}
                          {nextSem && new Date(semEndISO) < new Date(nextSem.startDate) && (() => {
                            const p = segPct(semEndISO, nextSem.startDate);
                            if (p.widthPct < 0.5) return null;
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.08) 0px, rgba(239,68,68,0.08) 6px, transparent 6px, transparent 12px)',
                                border: '1px dashed rgba(239,68,68,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.62rem', color: 'var(--danger)', fontWeight: 700,
                                pointerEvents: 'none',
                              }} title={`Gap ${daysBetween(semEndISO.slice(0,10), nextSem.startDate.slice(0,10))} ngày giữa ${detail.code} và ${nextSem.code}`}>
                                {p.widthPct > 3 ? `gap ${daysBetween(semEndISO.slice(0,10), nextSem.startDate.slice(0,10))}d` : ''}
                              </div>
                            );
                          })()}
                          {/* Đường chia tick — tính % theo offset ngày thật (chuẩn cho cả week & month mode) */}
                          {ticks.slice(1).map((t, i) => {
                            const offset = (t.getTime() - displayStart.getTime()) / 86400000;
                            const leftPct = (offset / displayDays) * 100;
                            return (
                              <div key={i} style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${leftPct}%`, width: 1,
                                background: 'rgba(255,255,255,0.18)',
                              }} />
                            );
                          })}
                          {/* Preview block (realtime từ form Add Holiday) */}
                          {previewHoliday && (() => {
                            const pos = positionItem(previewHoliday.startDate, previewHoliday.durationDays);
                            if (!pos) return null;
                            return (
                              <div
                                title={`Preview: ${previewHoliday.label} (${previewHoliday.durationDays}d${previewHoliday.isCompensated ? ', có bù' : ''})`}
                                style={{
                                  position: 'absolute', top: 0, bottom: 0,
                                  left: `${pos.leftPct}%`, width: `${pos.widthPct}%`,
                                  background: 'rgba(168, 85, 247, 0.4)',                // tím dashed -> phân biệt với data thật
                                  border: '2px dashed #a855f7',
                                  borderRadius: 4, zIndex: 5,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.65rem', color: 'white', fontWeight: 700,
                                  pointerEvents: 'none', overflow: 'hidden', whiteSpace: 'nowrap',
                                }}
                              >
                                {pos.widthPct > 5 ? '👁 Preview' : ''}
                              </div>
                            );
                          })()}
                          {/* Holiday overlays — drag-to-resize */}
                          {holidays.map(h => {
                            const eff = effective(h);
                            const pos = positionItem(eff.startDate, eff.durationDays);
                            if (!pos) return null;                            // không hiển thị nếu ngoài range tháng
                            const leftPct = pos.leftPct;
                            const widthPct = pos.widthPct;
                            const isDragging = dragState?.holidayId === h.id;
                            const isDirty = !!dirtyEdits[h.id] || isDragging;
                            const endDateISO = addDaysISO(eff.startDate, eff.durationDays);
                            return (
                              <div
                                key={h.id}
                                onMouseEnter={() => setHoveredHoliday(h.id)}
                                onMouseLeave={() => setHoveredHoliday(prev => (prev === h.id ? null : prev))}
                                style={{
                                  position: 'absolute', top: 0, bottom: 0,
                                  left: `${leftPct}%`, width: `${widthPct}%`,
                                  background: isDirty ? 'rgba(245, 158, 11, 0.55)' : 'rgba(239, 68, 68, 0.55)',
                                  borderLeft: '2px solid', borderRight: '2px solid',
                                  borderColor: isDirty ? 'var(--warning)' : 'var(--danger)',
                                  cursor: 'default',
                                  transition: dragState ? 'none' : 'background 0.05s',
                                }}
                              >
                                {/* Left edge handle */}
                                <div
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    setDragState({
                                      holidayId: h.id, edge: 'left',
                                      startX: ev.clientX, pxPerDay,
                                      origStart: eff.startDate.slice(0, 10),
                                      origDuration: eff.durationDays,
                                      liveStart: eff.startDate.slice(0, 10),
                                      liveDuration: eff.durationDays,
                                    });
                                  }}
                                  style={{
                                    position: 'absolute', top: 0, bottom: 0, left: -4, width: 10,
                                    cursor: 'ew-resize', zIndex: 2,
                                  }}
                                  className="holiday-edge"
                                />
                                {/* Right edge handle */}
                                <div
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    setDragState({
                                      holidayId: h.id, edge: 'right',
                                      startX: ev.clientX, pxPerDay,
                                      origStart: eff.startDate.slice(0, 10),
                                      origDuration: eff.durationDays,
                                      liveStart: eff.startDate.slice(0, 10),
                                      liveDuration: eff.durationDays,
                                    });
                                  }}
                                  style={{
                                    position: 'absolute', top: 0, bottom: 0, right: -4, width: 10,
                                    cursor: 'ew-resize', zIndex: 2,
                                  }}
                                  className="holiday-edge"
                                />
                                {/* Tooltip detail khi hover/drag */}
                                {(hoveredHoliday === h.id || isDragging) && (
                                  <div style={{
                                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                                    background: 'var(--surface-elevated, #1e293b)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: 8, padding: '0.5rem 0.75rem',
                                    fontSize: '0.72rem', color: 'var(--text-primary)',
                                    boxShadow: 'var(--shadow-lg)',
                                    whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                                  }}>
                                    <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>{h.label}</div>
                                    <div>📅 {fmt(eff.startDate)} to {fmt(endDateISO)}</div>
                                    <div>⏱ {eff.durationDays} ngày {h.isCompensated ? '(có bù)' : '(không bù)'}</div>
                                    {isDirty && <div style={{ color: 'var(--warning)', marginTop: '0.15rem' }}>● Chưa lưu</div>}
                                  </div>
                                )}
                                {/* Floating date label khi drag */}
                                {isDragging && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '50%', transform: 'translateY(-50%)',
                                    [dragState!.edge === 'left' ? 'left' : 'right']: -52,
                                    background: 'var(--accent-primary)', color: 'white',
                                    padding: '0.2rem 0.45rem', borderRadius: 4,
                                    fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
                                    pointerEvents: 'none', zIndex: 11,
                                  }}>
                                    {dragState!.edge === 'left' ? fmtShort(new Date(eff.startDate)) : fmtShort(new Date(endDateISO))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* === LANE 2: MILESTONE === */}
                        <div style={{
                          position: 'relative', height: '40px', marginTop: '0.4rem',
                          background: 'var(--surface-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)',
                          overflow: 'visible',
                        }}>
                          {/* Tick line cùng vị trí (tính theo offset ngày thật) */}
                          {ticks.slice(1).map((t, i) => {
                            const offset = (t.getTime() - displayStart.getTime()) / 86400000;
                            const leftPct = (offset / displayDays) * 100;
                            return (
                              <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${leftPct}%`, width: 1, background: 'rgba(255,255,255,0.12)' }} />
                            );
                          })}
                          {/* Preview milestone block (realtime từ form) */}
                          {previewMilestone && (() => {
                            const dur = Math.max(1, daysBetween(previewMilestone.windowStart, previewMilestone.windowEnd));
                            const pos = positionItem(previewMilestone.windowStart, dur);
                            if (!pos) return null;
                            const isReview = previewMilestone.type === 'Review';
                            return (
                              <div
                                title={`Preview: ${previewMilestone.label} (${dur}d)`}
                                style={{
                                  position: 'absolute', top: 4, bottom: 4,
                                  left: `${pos.leftPct}%`, width: `${pos.widthPct}%`,
                                  background: isReview ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                                  border: `2px dashed ${isReview ? '#3b82f6' : '#10b981'}`,
                                  borderRadius: 4, zIndex: 5,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.65rem', color: 'white', fontWeight: 700,
                                  pointerEvents: 'none', overflow: 'hidden', whiteSpace: 'nowrap',
                                }}
                              >
                                {pos.widthPct > 5 ? `👁 ${previewMilestone.label}` : '👁'}
                              </div>
                            );
                          })()}
                          {/* Render TẤT CẢ review — tô màu theo SemesterId (palette cố định) */}
                          {allReviews.filter(m => m.id !== previewMilestone?.hiddenId).map(m => {
                            const dur = Math.max(1, daysBetween(m.windowStart.slice(0, 10), m.windowEnd.slice(0, 10)));
                            const pos = positionItem(m.windowStart, dur);
                            if (!pos) return null;
                            // Palette 8 màu cố định — index theo position của semester trong list (ổn định hơn)
                            const palette = [
                              { bg: 'rgba(59, 130, 246, 0.55)',  border: '#3b82f6' },   // blue
                              { bg: 'rgba(16, 185, 129, 0.55)',  border: '#10b981' },   // green
                              { bg: 'rgba(251, 146, 60, 0.55)',  border: '#fb923c' },   // orange
                              { bg: 'rgba(168, 85, 247, 0.55)',  border: '#a855f7' },   // purple
                              { bg: 'rgba(236, 72, 153, 0.55)',  border: '#ec4899' },   // pink
                              { bg: 'rgba(14, 165, 233, 0.55)',  border: '#0ea5e9' },   // sky
                              { bg: 'rgba(234, 179, 8, 0.55)',   border: '#eab308' },   // yellow
                              { bg: 'rgba(220, 38, 38, 0.55)',   border: '#dc2626' },   // red
                            ];
                            const semIdx = list.findIndex(s => s.id === m.semesterId);
                            const paletteIdx = (semIdx >= 0 ? semIdx : m.semesterId) % palette.length;
                            const { bg: color, border: borderColor } = palette[Math.abs(paletteIdx)];
                            const homeSem = list.find(s => s.id === m.semesterId);
                            return (
                              <div
                                key={m.id}
                                title={`${m.label}${homeSem ? ` (kỳ ${homeSem.code})` : ''}: ${fmt(m.windowStart)} → ${fmt(m.windowEnd)}${m.note ? ` • ${m.note}` : ''}`}
                                style={{
                                  position: 'absolute', top: 4, bottom: 4,
                                  left: `${pos.leftPct}%`, width: `${pos.widthPct}%`,
                                  background: color,
                                  borderLeft: `2px solid ${borderColor}`,
                                  borderRight: pos.isClippedRight ? `2px dashed ${borderColor}` : `2px solid ${borderColor}`,
                                  borderRadius: 4,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.65rem', color: 'white', fontWeight: 700,
                                  cursor: 'help', overflow: 'hidden', whiteSpace: 'nowrap',
                                }}
                              >
                                {pos.widthPct > 5 ? m.label : ''}
                              </div>
                            );
                          })}
                        </div>

                        {/* Tick row — label theo mode (dd/MM hoặc MM/YYYY) */}
                        <div style={{ display: 'flex', marginTop: '0.4rem', position: 'relative' }}>
                          {ticks.map((d, i) => {
                            // Tính flex weight theo độ rộng từng tick (số ngày)
                            const next = i < ticks.length - 1 ? ticks[i + 1] : displayEnd;
                            const days = Math.max(1, (next.getTime() - d.getTime()) / 86400000);
                            return (
                              <div key={i} style={{
                                flex: days, minWidth: 0,
                                borderLeft: i === 0 ? 'none' : '1px dashed var(--border-glass)',
                                textAlign: 'center',
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                padding: '0.25rem 0',
                              }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tickLabelFn(d)}</div>
                                {tlMode === 'week' && <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Tuần {i + 1}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Chú thích + Save bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(251, 146, 60, 0.32)' }} /> Khoảng học
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(239, 68, 68, 0.55)' }} /> Ngày nghỉ
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(59, 130, 246, 0.55)' }} /> Review
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(16, 185, 129, 0.55)' }} /> Defence
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(148, 163, 184, 0.25)', border: '1px solid rgba(148,163,184,0.6)' }} /> Ngoài kỳ đang xem
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(245, 158, 11, 0.55)' }} /> Chưa lưu
                    </span>
                  </div>

                  {/* Save / Discard pending edits — kèm warning chip nếu có dirty */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {hasDirty && (
                      <span
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.25rem 0.6rem', borderRadius: '999px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: 'var(--warning)',
                          fontSize: '0.72rem', fontWeight: 600,
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          animation: 'pulse-warn 1.5s ease-in-out infinite',
                        }}
                        title="Bạn có thay đổi chưa lưu — nhấn 'Lưu thay đổi' để áp dụng"
                      >
                        ● {Object.keys(dirtyEdits).length} thay đổi chưa lưu
                      </span>
                    )}
                    <button
                      onClick={handleDiscardEdits}
                      disabled={!hasDirty || savingEdits}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', opacity: hasDirty ? 1 : 0.4, cursor: hasDirty ? 'pointer' : 'not-allowed' }}
                    >
                      Hủy thay đổi
                    </button>
                    <button
                      onClick={handleSaveEdits}
                      disabled={!hasDirty || savingEdits}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', opacity: hasDirty ? 1 : 0.5, cursor: hasDirty ? 'pointer' : 'not-allowed' }}
                    >
                      {savingEdits ? <><Loader2 size={14} className="spin" /> Đang lưu...</> : `Lưu thay đổi${hasDirty ? ` (${Object.keys(dirtyEdits).length})` : ''}`}
                    </button>
                  </div>
                </div>

                {/* CSS handle hover effect — sáng/đậm khi rê gần cạnh */}
                <style>{`
                  .holiday-edge { background: transparent; transition: background 0.05s, box-shadow 0.05s; }
                  .holiday-edge:hover { background: rgba(255,255,255,0.55); box-shadow: 0 0 8px rgba(251,146,60,0.7); }
                  @keyframes pulse-warn { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
                `}</style>
              </div>

              {/* Holidays table */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} color="var(--warning)" />
                    <h3 style={{ margin: 0 }}>Danh sách ngày nghỉ ({holidays.length})</h3>
                  </div>
                  <button className="btn btn-primary" onClick={openAddHoliday} style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Thêm ngày nghỉ
                  </button>
                </div>
                {holidays.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Kỳ học này chưa có ngày nghỉ. Bấm "Thêm ngày nghỉ" để chọn từ lễ chuẩn hoặc tạo mới.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Tên dịp</th>
                          <th>Ngày bắt đầu</th>
                          <th>Số ngày</th>
                          <th>Bù lịch</th>
                          <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.map(h => {
                          const eff = effective(h);
                          const isDirty = !!dirtyEdits[h.id];
                          return (
                          <tr key={h.id} style={isDirty ? { background: 'rgba(245, 158, 11, 0.06)' } : undefined}>
                            <td>
                              {h.label}
                              {h.templateId && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--text-secondary)', fontStyle: 'italic' }} title={`Template #${h.templateId}`}>
                                  (từ template)
                                </span>
                              )}
                              {isDirty && <span className="badge badge-warning" style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>Chưa lưu</span>}
                            </td>
                            <td>{fmt(eff.startDate)}</td>
                            <td>{eff.durationDays} ngày</td>
                            <td>
                              <span className={`badge ${h.isCompensated ? 'badge-success' : 'badge-warning'}`}>
                                {h.isCompensated ? 'Có bù' : 'Không bù'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                                onClick={() => handleDeleteHoliday(h)}
                                title="Xóa khỏi kỳ học"
                              >
                                <X size={13} /> Xóa
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Card Lịch Review / Defence */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0 }}>Lịch Review / Defence ({milestones.length})</h3>
                  </div>
                  <button className="btn btn-primary" onClick={openCreateMilestone} style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Thêm lịch review/defence
                  </button>
                </div>
                {milestones.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Chưa có lịch review/defence. Admin tự thêm theo nhu cầu (vd Review 1 từ 21/5 +2w).
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Loại</th>
                          <th>Window</th>
                          <th>Số ngày</th>
                          <th>Trạng thái</th>
                          <th>Kỳ gốc</th>
                          <th>Ghi chú</th>
                          <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milestones.map(m => {
                          const dur = Math.max(1, daysBetween(m.windowStart.slice(0,10), m.windowEnd.slice(0,10)));
                          const isOverflow = detail && new Date(m.windowEnd) > new Date(detail.endDate);
                          // m.semesterId là kỳ "home" — có thể khác semester đang xem (vì query overlap)
                          const isHomeSemester = detail && m.semesterId === detail.id;
                          const homeSem = list.find(s => s.id === m.semesterId);
                          const stMeta = REVIEW_STATUS_META[m.status ?? 'Draft'];
                          
                          const palette = [
                            { bg: 'rgba(59, 130, 246, 0.55)',  border: '#3b82f6' },
                            { bg: 'rgba(16, 185, 129, 0.55)',  border: '#10b981' },
                            { bg: 'rgba(251, 146, 60, 0.55)',  border: '#fb923c' },
                            { bg: 'rgba(168, 85, 247, 0.55)',  border: '#a855f7' },
                            { bg: 'rgba(236, 72, 153, 0.55)',  border: '#ec4899' },
                            { bg: 'rgba(14, 165, 233, 0.55)',  border: '#0ea5e9' },
                            { bg: 'rgba(234, 179, 8, 0.55)',   border: '#eab308' },
                            { bg: 'rgba(220, 38, 38, 0.55)',   border: '#dc2626' },
                          ];
                          const semIdx = list.findIndex(s => s.id === m.semesterId);
                          const paletteIdx = (semIdx >= 0 ? semIdx : m.semesterId) % palette.length;
                          const { bg: color, border: borderColor } = palette[Math.abs(paletteIdx)];

                          return (
                          <tr key={m.id} style={!isHomeSemester ? { background: 'rgba(148, 163, 184, 0.04)' } : undefined}>
                            <td>
                              <span className="badge" style={{
                                background: color,
                                color: 'white',
                                border: `1px solid ${borderColor}`,
                                fontWeight: 700
                              }}>
                                {m.label}
                              </span>
                              {isOverflow && <span className="badge badge-warning" style={{ marginLeft: '0.4rem', fontSize: '0.6rem' }}>Vắt biên</span>}
                            </td>
                            <td>{fmt(m.windowStart)} → {fmt(m.windowEnd)}</td>
                            <td>{dur} ngày</td>
                            <td>
                              <span className="badge" style={stMeta.style}>{stMeta.label}</span>
                            </td>
                            <td>
                              {isHomeSemester
                                ? <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(kỳ này)</span>
                                : <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-secondary)', fontSize: '0.7rem' }} title="Review thuộc kỳ khác nhưng overlap với kỳ đang xem">
                                    {homeSem?.code ?? `#${m.semesterId}`}
                                  </span>}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{m.note || '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                {(m.status ?? 'Draft') === 'Draft' && (
                                  <button
                                    className="btn btn-primary"
                                    style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                                    onClick={() => handleChangeReviewStatus(m, 'Registering')}
                                    title="Mở đăng ký — chuyển sang Registering"
                                  >
                                    Bắt đầu
                                  </button>
                                )}
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                                  onClick={() => openEditMilestone(m)}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                                  onClick={() => handleDeleteMilestone(m)}
                                >
                                  <X size={13} /> Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirm popup dùng chung — thay window.confirm/alert */}
      {confirmState && (() => {
        const variant = confirmState.variant ?? 'warning';
        const accent =
          variant === 'danger'  ? 'var(--danger)' :
          variant === 'info'    ? 'var(--accent-primary)' :
                                  'var(--warning)';
        const accentBg =
          variant === 'danger'  ? 'rgba(239, 68, 68, 0.12)' :
          variant === 'info'    ? 'rgba(251, 146, 60, 0.12)' :
                                  'rgba(245, 158, 11, 0.12)';
        return (
          <div
            onClick={closeConfirm}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="glass-panel animate-fade-in"
              style={{ width: '100%', maxWidth: 480, padding: 0, overflow: 'hidden', borderTop: `3px solid ${accent}` }}
            >
              {/* Header với icon + title */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '1.5rem 1.5rem 0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: accentBg, color: accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AlertCircle size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                    {confirmState.title}
                  </h3>
                  <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    {confirmState.message}
                  </p>
                </div>
              </div>

              {/* Optional list */}
              {confirmState.lines && confirmState.lines.length > 0 && (
                <div style={{
                  margin: '0.75rem 1.5rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--surface-glass)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  maxHeight: '200px', overflowY: 'auto',
                  fontSize: '0.8rem', color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                }}>
                  {confirmState.lines.map((l, i) => (
                    <div key={i} style={{ padding: '0.2rem 0' }}>• {l}</div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
                padding: '1rem 1.5rem 1.5rem',
                borderTop: '1px solid var(--border-glass)',
                marginTop: '1rem',
              }}>
                {confirmState.cancelLabel !== null && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeConfirm}
                    disabled={confirmBusy}
                  >
                    {confirmState.cancelLabel ?? 'Hủy'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={runConfirm}
                  disabled={confirmBusy}
                  style={variant === 'danger' ? { background: 'var(--danger)' } : undefined}
                >
                  {confirmBusy ? <><Loader2 size={16} className="spin" /> Đang xử lý...</> : (confirmState.confirmLabel ?? 'Xác nhận')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Add/Edit Milestone (Review/Defence) */}
      {milestoneMode !== null && detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 560, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              {milestoneMode === 'new' ? 'Thêm lịch Review / Defence' : 'Sửa lịch Review / Defence'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Window là cửa sổ thời gian admin mở cho student/lecturer book slot review/defence cụ thể.
            </p>

            <form onSubmit={handleSubmitMilestone}>
              {milestoneMode === 'new' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Loại <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select
                      className="input-field"
                      value={milestoneForm.type}
                      onChange={e => onTypeChange(e.target.value as MilestoneType)}
                    >
                      <option value="Review">Review </option>
                      <option value="Defence">Defence </option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Số thứ tự <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="number" required min={1} className="input-field"
                      value={milestoneForm.orderIndex}
                      onChange={e => setMilestoneForm({ ...milestoneForm, orderIndex: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Label <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text" required className="input-field"
                  placeholder="VD: Review 1, Defence 2, Final Defence..."
                  value={milestoneForm.label}
                  onChange={e => setMilestoneForm({ ...milestoneForm, label: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Ngày bắt đầu <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="date" required className="input-field"
                    min={detail.startDate.slice(0, 10)}
                    value={milestoneForm.windowStart}
                    onChange={e => setMilestoneForm({ ...milestoneForm, windowStart: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Ngày kết thúc <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="date" required className="input-field"
                    min={milestoneForm.windowStart}
                    value={milestoneForm.windowEnd}
                    onChange={e => setMilestoneForm({ ...milestoneForm, windowEnd: e.target.value })}
                  />
                </div>
              </div>

              {/* Quick preset: +1w / +2w / +3w */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}>Preset duration:</span>
                {[7, 14, 21].map(d => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => {
                      if (!milestoneForm.windowStart) return;
                      setMilestoneForm({ ...milestoneForm, windowEnd: addDaysISO(milestoneForm.windowStart, d) });
                    }}
                    disabled={!milestoneForm.windowStart}
                    style={{
                      padding: '0.25rem 0.6rem', fontSize: '0.7rem', borderRadius: '999px',
                      border: '1px solid var(--border-glass)', background: 'transparent',
                      color: 'var(--text-secondary)', cursor: milestoneForm.windowStart ? 'pointer' : 'not-allowed',
                      opacity: milestoneForm.windowStart ? 1 : 0.4,
                    }}
                  >
                    +{d / 7}w ({d}d)
                  </button>
                ))}
              </div>

              <div className="input-group">
                <label className="input-label">Trạng thái <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="input-field"
                  value={milestoneForm.status}
                  onChange={e => setMilestoneForm({ ...milestoneForm, status: e.target.value as ReviewStatus })}
                >
                  <option value="Draft">Chưa đăng ký được (chưa mở)</option>
                  <option value="Registering">Đang đăng ký</option>
                  <option value="Registered">Đã chốt slot</option>
                  <option value="Ongoing">Đang diễn ra</option>
                  <option value="Finished">Đã xong</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Ghi chú (optional)</label>
                <input
                  type="text" className="input-field"
                  placeholder="VD: Phòng 305, online qua Teams..."
                  value={milestoneForm.note}
                  onChange={e => setMilestoneForm({ ...milestoneForm, note: e.target.value })}
                />
              </div>

              {milestoneError && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {milestoneError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMilestoneMode(null)} disabled={savingMs}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={savingMs}>
                  {savingMs ? <><Loader2 size={16} className="spin" /> Đang lưu...</> : (milestoneMode === 'new' ? 'Tạo lịch' : 'Lưu thay đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal thêm ngày nghỉ vào kỳ */}
      {showAddHoliday && detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 580, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Thêm ngày nghỉ vào kỳ học</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Tự nhập thông tin ngày nghỉ cho kỳ học này.
            </p>

            <form onSubmit={handleAddHoliday}>
              <div className="input-group">
                <label className="input-label">Tên dịp <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text" required className="input-field"
                  placeholder="VD: Tết Nguyên Đán, 30/4 - 1/5..."
                  value={holidayForm.label}
                  onChange={e => setHolidayForm({ ...holidayForm, label: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Ngày bắt đầu <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="date" required className="input-field"
                    min={detail.startDate.slice(0, 10)}
                    max={detail.endDate.slice(0, 10)}
                    value={holidayForm.startDate}
                    onChange={e => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    Phải nằm trong {fmt(detail.startDate)} → {fmt(detail.endDate)}
                  </small>
                </div>
                <div className="input-group">
                  <label className="input-label">Số ngày nghỉ <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="number" required min={1} className="input-field"
                    value={holidayForm.durationDays}
                    onChange={e => setHolidayForm({ ...holidayForm, durationDays: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={holidayForm.isCompensated}
                    onChange={e => setHolidayForm({ ...holidayForm, isCompensated: e.target.checked })}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Có bù lịch (kỳ học sẽ kéo dài thêm số ngày nghỉ này)</span>
                </label>
              </div>

              {holidayForm.templateId !== null && (
                <div style={{
                  padding: '0.65rem 0.9rem', background: 'rgba(251, 146, 60, 0.08)',
                  border: '1px solid rgba(251, 146, 60, 0.2)', borderRadius: '8px',
                  fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem',
                }}>
                  💡 Ngày này sẽ được gắn template, nhưng các giá trị (ngày/duration/bù) chỉ áp riêng cho kỳ <strong style={{ color: 'var(--accent-primary)' }}>{detail.code}</strong>. Sửa template gốc không ảnh hưởng kỳ này.
                </div>
              )}

              {holidayError && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {holidayError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddHoliday(false)} disabled={addingHoliday}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingHoliday}>
                  {addingHoliday ? <><Loader2 size={16} className="spin" /> Đang thêm...</> : <><Plus size={16} /> Thêm ngày nghỉ</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal tạo kỳ học mới */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 520, padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Tạo kỳ học mới</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Chọn kỳ và năm — hệ thống gợi ý sẵn mốc thời gian, bạn có thể chỉnh tùy ý.
            </p>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Kỳ</label>
                  <select
                    className="input-field"
                    value={createForm.season}
                    onChange={e => updateSeason(e.target.value as SemesterSeason)}
                  >
                    <option value="Spring">Học kỳ Xuân (Spring)</option>
                    <option value="Summer">Học kỳ Hè (Summer)</option>
                    <option value="Fall">Học kỳ Thu (Fall)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Năm</label>
                  <input
                    type="number"
                    required
                    min={currentYear}
                    className="input-field"
                    value={createForm.year}
                    onChange={e => updateYear(parseInt(e.target.value, 10) || currentYear)}
                  />
                </div>
              </div>

              {/* Date range: chỉnh start → end auto-nới đủ 16w. Chỉnh end tay → giữ start, badge hiển thị chênh lệch. */}
              {(() => {
                const TARGET_DAYS = WEEKS_PER_SEMESTER * 7; // 112
                const gap = createForm.start && createForm.end
                  ? daysBetween(createForm.start, createForm.end)
                  : 0;
                const diff = gap - TARGET_DAYS;
                const gapLabel = !createForm.start || !createForm.end
                  ? '—'
                  : diff === 0
                    ? `+ ${WEEKS_PER_SEMESTER}w`
                    : diff > 0
                      ? `+ ${WEEKS_PER_SEMESTER}w + ${diff}d`
                      : `+ ${WEEKS_PER_SEMESTER}w − ${-diff}d`;
                const badgeColor = diff === 0 ? '#10b981' : diff > 0 ? '#0ea5e9' : '#ef4444';
                const badgeBg = diff === 0
                  ? 'rgba(16, 185, 129, 0.12)'
                  : diff > 0
                    ? 'rgba(14, 165, 233, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)';
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'end', marginBottom: '1rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Ngày bắt đầu</label>
                      <input
                        type="date" required className="input-field"
                        value={createForm.start}
                        onChange={e => {
                          const newStart = e.target.value;
                          if (newStart) {
                            // Auto-nới end để đủ 16w từ start mới
                            const newEnd = toISO(addDays(new Date(newStart), TARGET_DAYS));
                            setCreateForm({ ...createForm, start: newStart, end: newEnd });
                          } else {
                            setCreateForm({ ...createForm, start: newStart });
                          }
                        }}
                      />
                    </div>
                    <div
                      style={{
                        padding: '0.4rem 0.7rem',
                        background: badgeBg,
                        border: `1px solid ${badgeColor}40`,
                        borderRadius: 6,
                        color: badgeColor,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        marginBottom: '0.5rem',
                        textAlign: 'center',
                        userSelect: 'none',
                      }}
                      title="Khoảng cách giữa ngày bắt đầu và kết thúc"
                    >
                      {gapLabel}
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Ngày kết thúc</label>
                      <input
                        type="date" required className="input-field"
                        value={createForm.end}
                        onChange={e => setCreateForm({ ...createForm, end: e.target.value })}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Preview code sẽ được sinh ra (theo BE: Spring+2026 -> SP26) */}
              <div style={{
                padding: '0.75rem 1rem', background: 'rgba(251, 146, 60, 0.08)',
                border: '1px solid rgba(251, 146, 60, 0.2)', borderRadius: '8px',
                fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem',
              }}>
                Mã sẽ tạo: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                  {createForm.season === 'Spring' ? 'SP' : createForm.season === 'Summer' ? 'SU' : 'FA'}
                  {String(createForm.year).slice(-2)}
                </strong>
              </div>

              {createError && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {createError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin" /> Đang tạo...</> : <><Plus size={16} /> Tạo kỳ học</>}
                </button>
              </div>
            </form>
          </div>
          <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}
    </div>
  );
};

// Stat block nhỏ dùng trong header card
const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      {icon} {label}
    </span>
    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{value}</strong>
  </div>
);

export default AdminSemesters;
