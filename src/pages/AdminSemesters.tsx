import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type {
  SemesterListItemDto,
  SemesterDetailDto,
  SemesterHolidayDto,
  SemesterStatus,
  SemesterSeason,
  HolidayTemplateDto,
  LinkGroupsResultDto,
} from '../types';
import { Calendar, Filter, Users, Clock, AlertCircle, Plus, Loader2, RefreshCw, ChevronDown, BookmarkPlus, X, Link2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  // Lưu các thay đổi drag — PUT từng cái
  const handleSaveEdits = async () => {
    if (!hasDirty || savingEdits) return;
    try {
      setSavingEdits(true);
      const ids = Object.keys(dirtyEdits).map(n => parseInt(n, 10));
      for (const id of ids) {
        const e = dirtyEdits[id];
        await api.put(`/api/admin/semester-holidays/${id}`, {
          startDate: e.startDate,
          durationDays: e.durationDays,
        });
      }
      setDirtyEdits({});
      if (detail) await Promise.all([loadDetail(detail.id), loadList()]);
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

  // === Holiday Templates (kho lễ chuẩn, độc lập với semester) ===
  const [templates, setTemplates] = useState<HolidayTemplateDto[]>([]);
  const loadTemplates = async () => {
    try {
      const res = await api.get<HolidayTemplateDto[]>('/api/admin/holiday-templates');
      setTemplates(res.data);
    } catch (e) {
      console.error('Load holiday templates failed', e);
    }
  };
  // Load 1 lần khi mount — templates không đổi theo semester
  useEffect(() => { loadTemplates(); }, []);

  // === Modal "Thêm ngày lễ vào kỳ" ===
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

  // Kiểm tra template có rơi trong khoảng [semester.start, semester.end] hay không.
  // VD: template Tết 10/2 không match cho Fall (Sep-Dec) → loại khỏi đề xuất.
  // Logic: thử construct date với Year của semester; nếu nằm trong range thì OK.
  // Edge case: ngày kết thúc template (start + duration) vượt qua end semester cũng vẫn cho phép (BE sẽ clamp/cảnh báo sau).
  const templateFitsSemester = (tpl: HolidayTemplateDto, sem: SemesterDetailDto): boolean => {
    const yyyy = sem.year;
    const mm = String(tpl.defaultStartMonth).padStart(2, '0');
    const dd = String(tpl.defaultStartDay).padStart(2, '0');
    const candidateStart = new Date(`${yyyy}-${mm}-${dd}`);
    const semStart = new Date(sem.startDate);
    const semEnd = new Date(sem.endDate);
    return candidateStart >= semStart && candidateStart <= semEnd;
  };

  // Templates lọc theo semester đang xem (chỉ hiện những lễ rơi trong khoảng kỳ)
  const eligibleTemplates = useMemo(() => {
    if (!detail) return [] as HolidayTemplateDto[];
    return templates.filter(t => templateFitsSemester(t, detail));
  }, [templates, detail]);

  // Apply template -> fill form theo Year của semester đang xem
  const applyTemplate = (tpl: HolidayTemplateDto | null) => {
    if (!tpl || !detail) {
      setHolidayForm({ ...blankHolidayForm });
      return;
    }
    // Ngày gợi ý: dùng Year của semester (vd Tết template có Default 10/2 -> 2026-02-10)
    const yyyy = detail.year;
    const mm = String(tpl.defaultStartMonth).padStart(2, '0');
    const dd = String(tpl.defaultStartDay).padStart(2, '0');
    let suggested = `${yyyy}-${mm}-${dd}`;
    // Clamp về startDate của semester nếu suggested rơi trước (vd Tết template 10/2 nhưng kỳ Spring bắt đầu 01/01 -> ok; Fall bắt đầu sau 10/2 -> clamp lên)
    if (new Date(suggested) < new Date(detail.startDate)) {
      suggested = detail.startDate.slice(0, 10);
    }
    setHolidayForm({
      templateId: tpl.id,
      label: tpl.label,
      startDate: suggested,
      durationDays: tpl.defaultDurationDays,
      isCompensated: tpl.isCompensated,
    });
  };

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
      setHolidayError('Tên ngày lễ không được rỗng');
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
      await api.post('/api/admin/semester-holidays', {
        semesterId: detail.id,
        templateId: holidayForm.templateId,
        label: holidayForm.label.trim(),
        startDate: holidayForm.startDate,
        durationDays: holidayForm.durationDays,
        isCompensated: holidayForm.isCompensated,
      });
      setShowAddHoliday(false);
      await Promise.all([loadDetail(detail.id), loadList()]);  // loadList vì EndDate có thể đổi (auto-recalc)
    } catch (err: any) {
      setHolidayError(err?.response?.data?.message || 'Thêm ngày lễ thất bại');
    } finally {
      setAddingHoliday(false);
    }
  };

  // Xóa 1 holiday — confirm qua popup
  const handleDeleteHoliday = (h: SemesterHolidayDto) => {
    openConfirm({
      title: 'Xóa ngày lễ?',
      message: `Bỏ "${h.label}" khỏi kỳ học này. EndDate kỳ học có thể được tính lại nếu lễ có bù.`,
      variant: 'danger',
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/semester-holidays/${h.id}`);
          if (detail) await Promise.all([loadDetail(detail.id), loadList()]);
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
      // Auto-select item đầu nếu chưa chọn gì
      if (res.data.length > 0 && selectedId === null) {
        setSelectedId(res.data[0].id);
      }
    } catch (e) {
      console.error('Load semesters failed', e);
    } finally {
      setLoading(false);
    }
  };

  // Load detail + holidays cho semester được chọn (parallel)
  const loadDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      const [d, h] = await Promise.all([
        api.get<SemesterDetailDto>(`/api/admin/semesters/${id}`),
        api.get<SemesterHolidayDto[]>(`/api/admin/semester-holidays`, { params: { semesterId: id } }),
      ]);
      setDetail(d.data);
      setHolidays(h.data);
    } catch (e) {
      console.error('Load semester detail failed', e);
      setDetail(null);
      setHolidays([]);
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

  // Tổng số ngày để vẽ timeline (% theo ratio)
  const totalDays = useMemo(() => {
    if (!detail) return 1;
    return Math.max(1, daysBetween(detail.startDate, detail.endDate));
  }, [detail]);

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
                ) : filteredItems.map(s => {
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
                })}
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
                  {/* Dropdown đổi trạng thái — click vào badge để mở */}
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
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Trục thời gian (theo tuần)</h3>

                {/* Container có scroll ngang nếu nhiều tuần */}
                <div style={{ overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  {(() => {
                    // Tạo array các tuần — mỗi tuần là 1 mốc Date (tuần 1 = startDate)
                    const start = new Date(detail.startDate);
                    const weeks = Array.from({ length: weekCount + 1 }, (_, i) => new Date(start.getTime() + i * 7 * 86400000));
                    const MIN_COL = 70;                           // min width / cột tuần để dd/MM đọc được
                    const trackWidth = Math.max(weekCount * MIN_COL, 600);

                    // pxPerDay tính dựa vào trackWidth — dùng cho drag delta
                    const pxPerDay = trackWidth / totalDays;
                    return (
                      <div style={{ minWidth: trackWidth, position: 'relative' }}>
                        {/* Bar nền + holiday overlays */}
                        <div style={{ position: 'relative', height: '52px', background: 'var(--surface-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)', overflow: 'visible' }}>
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: '8px',
                            background: 'linear-gradient(90deg, rgba(251, 146, 60, 0.18), rgba(251, 146, 60, 0.32))',
                          }} />
                          {/* Đường chia tuần (vertical lines) */}
                          {weeks.slice(1, -1).map((_, i) => {
                            const leftPct = ((i + 1) / weekCount) * 100;
                            return (
                              <div key={i} style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${leftPct}%`, width: 1,
                                background: 'rgba(255,255,255,0.18)',
                              }} />
                            );
                          })}
                          {/* Holiday overlays — drag-to-resize */}
                          {holidays.map(h => {
                            const eff = effective(h);
                            const offsetDays = daysBetween(detail.startDate, eff.startDate);
                            const leftPct = (offsetDays / totalDays) * 100;
                            const widthPct = Math.max(0.8, (eff.durationDays / totalDays) * 100);
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
                                  transition: dragState ? 'none' : 'background 0.15s',
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
                                    <div>📅 {fmt(eff.startDate)} → {fmt(endDateISO)}</div>
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

                        {/* Tick row — số tuần + dd/MM */}
                        <div style={{ display: 'flex', marginTop: '0.4rem' }}>
                          {weeks.slice(0, -1).map((d, i) => (
                            <div key={i} style={{
                              flex: 1,
                              borderLeft: i === 0 ? 'none' : '1px dashed var(--border-glass)',
                              textAlign: 'center',
                              fontSize: '0.7rem',
                              color: 'var(--text-secondary)',
                              padding: '0.25rem 0',
                            }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtShort(d)}</div>
                              <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Tuần {i + 1}</div>
                            </div>
                          ))}
                          {/* Tick cuối — ngày kết thúc */}
                          <div style={{
                            flex: 0, minWidth: '0',
                            borderLeft: '1px solid var(--border-glass)',
                            paddingLeft: '0.4rem',
                            fontSize: '0.7rem', fontWeight: 600,
                            color: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center',
                          }}>
                            {fmtShort(new Date(detail.endDate))}
                          </div>
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
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(245, 158, 11, 0.55)' }} /> Chưa lưu
                    </span>
                  </div>

                  {/* Save / Discard pending edits — chỉ sáng khi hasDirty */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                  .holiday-edge { background: transparent; transition: background 0.15s; }
                  .holiday-edge:hover { background: rgba(255,255,255,0.55); box-shadow: 0 0 8px rgba(251,146,60,0.7); }
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
                    <Plus size={14} /> Thêm ngày lễ
                  </button>
                </div>
                {holidays.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Kỳ học này chưa có ngày nghỉ. Bấm "Thêm ngày lễ" để chọn từ kho lễ chuẩn hoặc tạo mới.
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

      {/* Modal thêm ngày lễ vào kỳ */}
      {showAddHoliday && detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 580, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Thêm ngày lễ vào kỳ học</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Chọn từ kho lễ chuẩn để auto-fill, hoặc tự nhập ad-hoc. Lễ chuẩn có thể chỉnh ngày cho phù hợp năm này.
            </p>

            {/* Chip chọn template */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookmarkPlus size={14} /> Chọn từ kho lễ chuẩn (tùy chọn)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem 0' }}>
                <button
                  type="button"
                  onClick={() => applyTemplate(null)}
                  style={{
                    padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '999px',
                    background: holidayForm.templateId === null ? 'var(--accent-primary)' : 'transparent',
                    color: holidayForm.templateId === null ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${holidayForm.templateId === null ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                    cursor: 'pointer',
                  }}
                >
                  Tự tạo
                </button>
                {eligibleTemplates.map(tpl => {
                  const active = holidayForm.templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      title={`Mặc định: ${tpl.defaultStartDay}/${tpl.defaultStartMonth} • ${tpl.defaultDurationDays} ngày`}
                      style={{
                        padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '999px',
                        background: active ? 'var(--accent-primary)' : 'transparent',
                        color: active ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      {tpl.label}
                      <span style={{ marginLeft: '0.35rem', opacity: 0.75, fontSize: '0.7rem' }}>
                        {tpl.defaultStartDay}/{tpl.defaultStartMonth}
                      </span>
                    </button>
                  );
                })}
                {eligibleTemplates.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {templates.length === 0
                      ? 'Chưa có template nào. (Bạn vẫn có thể tự nhập bên dưới.)'
                      : `Không có lễ chuẩn nào rơi trong khoảng ${fmt(detail.startDate)} → ${fmt(detail.endDate)}.`}
                  </span>
                )}
              </div>
            </div>

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
                  {addingHoliday ? <><Loader2 size={16} className="spin" /> Đang thêm...</> : <><Plus size={16} /> Thêm ngày lễ</>}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Ngày bắt đầu</label>
                  <input
                    type="date" required className="input-field"
                    value={createForm.start}
                    onChange={e => setCreateForm({ ...createForm, start: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Ngày kết thúc</label>
                  <input
                    type="date" required className="input-field"
                    value={createForm.end}
                    onChange={e => setCreateForm({ ...createForm, end: e.target.value })}
                  />
                </div>
              </div>

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
