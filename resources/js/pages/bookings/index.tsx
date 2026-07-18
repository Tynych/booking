import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import './booking-calendar.css';

interface TableItem {
    id: number;
    name: string;
    capacity: number;
    zone: string | null;
}

interface BookingItem {
    id: number;
    table_id: number;
    guest_name: string;
    guest_phone: string | null;
    party_size: number;
    deposit: number | null;
    notes: string | null;
    start_time: string;
    end_time: string;
    status: string;
}

interface SearchResult {
    id: number;
    guest_name: string;
    guest_phone: string | null;
    party_size: number;
    start_time: string;
    end_time: string;
    status: string;
    table_id: number;
    table_name: string;
}

interface BookingsProps {
    tables: TableItem[];
    bookings: BookingItem[];
    date: string;
    workStart: string;   // "09:00"
    workEndHour: number; // 24 = полночь
}

const STATUS_OPTIONS = [
    { value: 'confirmed', label: 'Подтверждено' },
    { value: 'seated', label: 'Гости за столом' },
    { value: 'completed', label: 'Завершено' },
    { value: 'no_show', label: 'Не пришли' },
    { value: 'cancelled', label: 'Отменено' },
];

const SOON_THRESHOLD_MINUTES = 15;

function toInputValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatSearchWhen(iso: string): string {
    return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function BookingsIndex({ tables, bookings, date, workStart, workEndHour }: BookingsProps) {
    const workEndLabel = workEndHour >= 24 ? '24:00:00' : `${String(workEndHour).padStart(2, '0')}:00:00`;    const { auth } = usePage<SharedData>().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewingBooking, setViewingBooking] = useState<BookingItem | null>(null);
    const calendarRef = useRef<FullCalendar>(null);
    const [isCompact, setIsCompact] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);
    const searchWrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const check = () => setIsCompact(window.innerWidth <= 1366);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Эффект №1: переключение даты и прокрутка к нужному часу
    useEffect(() => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        api.gotoDate(date);

        const today = new Date().toISOString().slice(0, 10);
        if (date === today) {
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            api.scrollToTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:00`);
        } else {
            api.scrollToTime(`${workStart}:00`);
        }
    }, [date]);

    // Эффект №2: подсветка столов с приближающейся/просроченной бронью
    useEffect(() => {
        const applyTableHighlights = () => {
            const today = new Date().toISOString().slice(0, 10);

            if (date !== today) {
                document.querySelectorAll('[data-table-id]').forEach((el) => {
                    el.classList.remove('table-row-soon', 'table-row-overdue');
                });
                return;
            }

            const now = new Date();
            const soonMs = SOON_THRESHOLD_MINUTES * 60 * 1000;
            const activeByTable = new Map<string, 'soon' | 'overdue'>();

            bookings.forEach((b) => {
                if (b.status !== 'confirmed') return;

                const diff = new Date(b.start_time).getTime() - now.getTime();

                if (diff <= 0) {
                    activeByTable.set(String(b.table_id), 'overdue');
                } else if (diff <= soonMs && activeByTable.get(String(b.table_id)) !== 'overdue') {
                    activeByTable.set(String(b.table_id), 'soon');
                }
            });

            document.querySelectorAll('[data-table-id]').forEach((el) => {
                const tableId = (el as HTMLElement).dataset.tableId;
                const state = tableId ? activeByTable.get(tableId) : undefined;
                el.classList.toggle('table-row-soon', state === 'soon');
                el.classList.toggle('table-row-overdue', state === 'overdue');
            });
        };

        applyTableHighlights();
        const timer = window.setInterval(applyTableHighlights, 15000);
        return () => window.clearInterval(timer);
    }, [bookings, date]);

// Поиск брони: debounce 300мс, чтобы не долбить сервер на каждое нажатие клавиши
    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }

        setSearchLoading(true);
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(`${route('bookings.search')}?q=${encodeURIComponent(searchQuery.trim())}`, {
                    headers: { Accept: 'application/json' },
                });
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.results ?? []);
                    setSearchOpen(true);
                }
            } catch {
                // тихо игнорируем сетевые сбои поиска — это вспомогательная функция, не критичная операция
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => window.clearTimeout(timer);
    }, [searchQuery]);

    // Закрываем выпадающий список поиска по клику вне его
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Как только после перехода на нужную дату бронь из поиска появится в bookings — открываем её просмотр
    useEffect(() => {
        if (pendingBookingId == null) return;
        const found = bookings.find((b) => b.id === pendingBookingId);
        if (found) {
            setViewingBooking(found);
            setPendingBookingId(null);
        }
    }, [bookings, pendingBookingId]);


    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        table_id: '',
        guest_name: '',
        guest_phone: '',
        party_size: '2',
        deposit: '',
        notes: '',
        start_time: '',
        end_time: '',
        status: 'confirmed',
    });

    const openCreateModal = (tableId?: string, start?: Date, end?: Date) => {
        clearErrors();
        setEditingId(null);
        reset();
        if (tableId) setData((prev) => ({ ...prev, table_id: tableId }));
        if (start) setData((prev) => ({ ...prev, start_time: toInputValue(start) }));
        if (end) setData((prev) => ({ ...prev, end_time: toInputValue(end) }));
        setModalOpen(true);
    };

    const openEditModal = (booking: BookingItem) => {
        clearErrors();
        setEditingId(booking.id);
        setData({
            table_id: String(booking.table_id),
            guest_name: booking.guest_name,
            guest_phone: booking.guest_phone ?? '',
            party_size: String(booking.party_size),
            deposit: booking.deposit != null ? String(booking.deposit) : '',
            notes: booking.notes ?? '',
            start_time: toInputValue(new Date(booking.start_time)),
            end_time: toInputValue(new Date(booking.end_time)),
            status: booking.status,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
        reset();
    };

    const closeViewModal = () => setViewingBooking(null);

    const handleEditFromView = () => {
        if (!viewingBooking) return;
        const booking = viewingBooking;
        setViewingBooking(null);
        openEditModal(booking);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingId) {
            patch(route('bookings.update', editingId), {
                only: ['bookings'],
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('bookings.store'), {
                only: ['bookings'],
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!editingId) return;
        if (confirm('Удалить бронь?')) {
            router.delete(route('bookings.destroy', editingId), {
                only: ['bookings'],
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const changeDate = (newDate: string) => {
        router.get(route('bookings.index'), { date: newDate }, { only: ['bookings', 'date'], preserveState: true, preserveScroll: true });
    };

    const selectSearchResult = (result: SearchResult) => {
        const bookingDate = result.start_time.slice(0, 10);
        setPendingBookingId(result.id);
        setSearchQuery('');
        setSearchResults([]);
        setSearchOpen(false);
        changeDate(bookingDate);
    };

    const shiftDate = (days: number) => {
        const d = new Date(date + 'T00:00:00');
        d.setDate(d.getDate() + days);
        changeDate(d.toISOString().slice(0, 10));
    };

    const resources = tables.map((t) => ({
        id: String(t.id),
        title: t.name,
        extendedProps: { capacity: t.capacity, zone: t.zone },
    }));

    const events = bookings.map((b) => ({
        id: String(b.id),
        resourceId: String(b.table_id),
        title: b.guest_name,
        start: b.start_time,
        end: b.end_time,
        classNames: [`status-${b.status}`],
        extendedProps: { partySize: b.party_size },
    }));

    const showServerError = (errors: Record<string, string>) => {
        const message = Object.values(errors)[0];
        if (message) alert(message);
    };

    const patchBooking = (id: string, payload: Record<string, unknown>, onFail: () => void) => {
        router.patch(route('bookings.update', id), payload, {
            only: ['bookings'],
            preserveState: true,
            preserveScroll: true,
            onError: (errors) => {
                showServerError(errors as Record<string, string>);
                onFail();
            },
        });
    };

    const handleEventDrop = (info: any) => {
        if (info.event.start && info.event.start < new Date()) {
            alert('Нельзя перенести бронь на прошедшее время.');
            info.revert();
            return;
        }
        patchBooking(
            info.event.id,
            {
                table_id: Number(info.event.getResources()[0]?.id),
                start_time: info.event.startStr,
                end_time: info.event.endStr,
            },
            () => info.revert(),
        );
    };

    const handleEventResize = (info: any) => {
        const startChanged = info.event.start.getTime() !== info.oldEvent.start.getTime();

        if (startChanged && info.event.start < new Date()) {
            alert('Нельзя перенести начало брони на прошедшее время.');
            info.revert();
            return;
        }

        // Отправляем start_time только если он реально изменился.
        // Так при растягивании одного лишь правого края сервер даже не увидит
        // поле start_time и не будет его ни с чем сравнивать.
        const payload: Record<string, unknown> = { end_time: info.event.endStr };
        if (startChanged) {
            payload.start_time = info.event.startStr;
        }

        patchBooking(info.event.id, payload, () => info.revert());
    };

    // Разрешаем перетаскивание/растягивание, только если конечное состояние валидно.
    // Если начало НЕ меняется (тянут только конец) — разрешено всегда, вне зависимости от статуса.
    // Если начало меняется — новое начало не должно быть в прошлом.
    const handleEventAllow = (dropInfo: any, draggedEvent: any) => {
        try {
            if (!draggedEvent?.start || !dropInfo?.start) return true;

            const originalStart = draggedEvent.start.getTime();
            const newStart = dropInfo.start.getTime();

            // Небольшой допуск (1 секунда) вместо строгого равенства — растягивание
            // только правого края не должно считаться изменением начала даже при
            // микроскопических расхождениях в округлении даты.
            if (Math.abs(newStart - originalStart) < 1000) return true;

            return newStart >= Date.now();
        } catch {
            // Если что-то пошло не так при проверке — не блокируем действие вслепую,
            // финальная защита всё равно есть на сервере (assertNotPast).
            return true;
        }
    };

    const handleDateClick = (arg: any) => {
        const start = arg.date as Date;

        if (start < new Date()) {
            alert('Нельзя создать бронь на прошедшее время.');
            return;
        }

        const end = new Date(start.getTime() + 90 * 60000);
        openCreateModal(String(arg.resource?.id ?? ''), start, end);
    };

    // Клик по существующей брони — открыть окно ПРОСМОТРА (не редактирования)
    const handleEventClick = (info: any) => {
        const booking = bookings.find((b) => String(b.id) === info.event.id);
        if (booking) setViewingBooking(booking);
    };

    return (
        <div className="booking-page">
            <Head title="Брони" />

            <div className="booking-toolbar">
                <div className="booking-toolbar-left">
                    <div className="booking-brand">
                        <span className="booking-brand-dot" />
                        Брони
                    </div>
                    <div className="booking-divider" />
                    <button className="booking-btn" onClick={() => shiftDate(-1)}>‹</button>
                    <input
                        type="date"
                        className="booking-date-input"
                        style={{ margin: '0 8px' }}
                        value={date}
                        onChange={(e) => changeDate(e.target.value)}
                    />
                    <button className="booking-btn" onClick={() => shiftDate(1)}>›</button>
                    <button className="booking-btn" style={{marginLeft: 8}}
                            onClick={() => changeDate(new Date().toISOString().slice(0, 10))}>
                        Сегодня
                    </button>

                    <div className="booking-search-wrap" ref={searchWrapRef}>
                        <svg className="booking-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2">
                            <circle cx="11" cy="11" r="7"/>
                            <path d="M21 21l-4.3-4.3"/>
                        </svg>
                        <input
                            type="text"
                            className="booking-search-input"
                            placeholder="Поиск по имени или телефону"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) setSearchOpen(true);
                            }}
                        />
                        {searchOpen && (
                            <div className="booking-search-results">
                                {searchLoading && <div className="booking-search-empty">Ищем…</div>}
                                {!searchLoading && searchResults.length === 0 && (
                                    <div className="booking-search-empty">Ничего не найдено</div>
                                )}
                                {!searchLoading &&
                                    searchResults.map((r) => (
                                        <div key={r.id} className="booking-search-item"
                                             onClick={() => selectSearchResult(r)}>
                                            <div className="top">
                                                <span className="name">{r.guest_name}</span>
                                                <span className="when">{formatSearchWhen(r.start_time)}</span>
                                            </div>
                                            <div className="meta">
                                                {r.table_name} · {r.party_size} гост.
                                                {r.guest_phone && ` · ${r.guest_phone}`}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="booking-toolbar-right">
                    <div className="booking-legend">
                        <div className="booking-legend-item" title="Подтверждено"><span className="booking-legend-dot" style={{ background: '#4C8BF5' }} /><span className="booking-legend-label">Подтверждено</span></div>
                        <div className="booking-legend-item" title="За столом"><span className="booking-legend-dot" style={{ background: '#43B075' }} /><span className="booking-legend-label">За столом</span></div>
                        <div className="booking-legend-item" title="Не пришли"><span className="booking-legend-dot" style={{ background: '#F5A623' }} /><span className="booking-legend-label">Не пришли</span></div>
                        <div className="booking-legend-item" title="Отменено"><span className="booking-legend-dot" style={{ background: '#E5484D' }} /><span className="booking-legend-label">Отменено</span></div>
                        <div className="booking-legend-item" title="Стол: бронь скоро"><span className="booking-legend-dot" style={{ background: '#D4A24C' }} /><span className="booking-legend-label">Стол: бронь скоро</span></div>
                        <div className="booking-legend-item" title="Стол: гость опаздывает"><span className="booking-legend-dot" style={{ background: '#E5484D' }} /><span className="booking-legend-label">Стол: гость опаздывает</span></div>
                    </div>
                    {auth.user.role === 'manager' && (
                        <Link href={route('admin.dashboard')} className="booking-btn">Админ-панель</Link>
                    )}
                    <Link href={route('logout')} method="post" as="button" className="booking-btn">Выйти</Link>
                    <button className="booking-btn-primary" onClick={() => openCreateModal()}>+ Новая бронь</button>
                </div>
            </div>

            <div className="booking-calendar-wrap">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[resourceTimelinePlugin, interactionPlugin]}
                    initialView="resourceTimelineDay"
                    initialDate={date}
                    headerToolbar={false}
                    resourceAreaWidth={isCompact ? '110px' : '150px'}
                    resourceAreaHeaderContent="Столы"
                    slotDuration="00:15:00"
                    slotLabelInterval="01:00"
                    slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    slotMinWidth={isCompact ? 30 : 35}
                    slotMinTime={`${workStart}:00`}
                    slotMaxTime={workEndLabel}
                    nowIndicator={true}
                    height="100%"
                    resources={resources}
                    events={events}
                    editable={true}
                    eventResizableFromStart={true}
                    snapDuration="00:15:00"
                    dateClick={handleDateClick}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}
                    eventAllow={handleEventAllow}
                    eventClick={handleEventClick}
                    resourceLabelDidMount={(info) => {
                        info.el.dataset.tableId = String(info.resource.id);
                    }}
                    resourceLaneDidMount={(info) => {
                        info.el.dataset.tableId = String(info.resource.id);
                    }}
                    resourceLabelContent={(arg) => {
                        const zone = arg.resource.extendedProps.zone as string | null;
                        const capacity = arg.resource.extendedProps.capacity as number;
                        return (
                            <div>
                                <div className="fc-resource-name">{arg.resource.title}</div>
                                <div className="fc-resource-meta">
                                    {capacity} мест{!isCompact && zone && <span className="fc-resource-zone">{zone}</span>}
                                </div>
                            </div>
                        );
                    }}
                    eventContent={(arg) => (
                        <div className="fc-event-main-frame">
                            <div className="fc-booking-title">{arg.event.title}</div>
                            <div className="fc-booking-sub">{arg.event.extendedProps.partySize} гост.</div>
                        </div>
                    )}
                />
            </div>

            {/* Модалка ПРОСМОТРА */}
            {viewingBooking && (
                <div className="booking-modal-overlay" onClick={closeViewModal}>
                    <div className="booking-modal booking-view" onClick={(e) => e.stopPropagation()}>
                        <div className="booking-view-header">
                            <div>
                                <h2>{viewingBooking.guest_name}</h2>
                                <span className={`booking-status-badge status-${viewingBooking.status}`}>
                                    {STATUS_OPTIONS.find((s) => s.value === viewingBooking.status)?.label}
                                </span>
                            </div>
                            <button className="booking-modal-close" onClick={closeViewModal} aria-label="Закрыть">×</button>
                        </div>

                        <div className="booking-view-rows">
                            <div className="booking-view-row">
                                <span className="booking-view-label">Стол</span>
                                <span className="booking-view-value">
                                    {tables.find((t) => t.id === viewingBooking.table_id)?.name ?? '—'}
                                </span>
                            </div>
                            <div className="booking-view-row">
                                <span className="booking-view-label">Время</span>
                                <span className="booking-view-value">
                                    {formatTime(viewingBooking.start_time)} – {formatTime(viewingBooking.end_time)}
                                </span>
                            </div>
                            <div className="booking-view-row">
                                <span className="booking-view-label">Гостей</span>
                                <span className="booking-view-value">{viewingBooking.party_size}</span>
                            </div>
                            {viewingBooking.guest_phone && (
                                <div className="booking-view-row">
                                    <span className="booking-view-label">Телефон</span>
                                    <span className="booking-view-value">{viewingBooking.guest_phone}</span>
                                </div>
                            )}
                            {viewingBooking.deposit != null && (
                                <div className="booking-view-row">
                                    <span className="booking-view-label">Депозит</span>
                                    <span className="booking-view-value">{viewingBooking.deposit}</span>
                                </div>
                            )}
                            {viewingBooking.notes && (
                                <div className="booking-view-row booking-view-row-block">
                                    <span className="booking-view-label">Комментарий</span>
                                    <p className="booking-view-comment">{viewingBooking.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="booking-modal-actions">
                            <button type="button" className="booking-btn" onClick={closeViewModal}>Закрыть</button>
                            <button type="button" className="booking-btn-primary" onClick={handleEditFromView}>Изменить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка СОЗДАНИЯ / РЕДАКТИРОВАНИЯ */}
            {modalOpen && (
                <div className="booking-modal-overlay" onClick={closeModal}>
                    <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingId ? 'Редактировать бронь' : 'Новая бронь'}</h2>
                        <form onSubmit={submit}>
                            <div className="booking-field">
                                <label htmlFor="table_id">Стол</label>
                                <select id="table_id" value={data.table_id} onChange={(e) => setData('table_id', e.target.value)}>
                                    <option value="">Выберите стол</option>
                                    {tables.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.capacity} мест)</option>
                                    ))}
                                </select>
                                {errors.table_id && <div className="booking-error">{errors.table_id}</div>}
                            </div>

                            <div className="booking-field">
                                <label htmlFor="guest_name">Гость</label>
                                <input id="guest_name" value={data.guest_name} onChange={(e) => setData('guest_name', e.target.value)} placeholder="Иванов" />
                                {errors.guest_name && <div className="booking-error">{errors.guest_name}</div>}
                            </div>

                            <div className="booking-field">
                                <label htmlFor="guest_phone">Телефон</label>
                                <input id="guest_phone" value={data.guest_phone} onChange={(e) => setData('guest_phone', e.target.value)} placeholder="+998 90 123 45 67" />
                            </div>

                            <div className="booking-field">
                                <label htmlFor="party_size">Гостей</label>
                                <input id="party_size" type="number" min={1} value={data.party_size} onChange={(e) => setData('party_size', e.target.value)} />
                                {errors.party_size && <div className="booking-error">{errors.party_size}</div>}
                            </div>

                            <div className="booking-field">
                                <label htmlFor="deposit">Депозит (необязательно)</label>
                                <input id="deposit" type="number" min={0} step="0.01" value={data.deposit} onChange={(e) => setData('deposit', e.target.value)} placeholder="0" />
                                {errors.deposit && <div className="booking-error">{errors.deposit}</div>}
                            </div>

                            <div className="booking-field">
                                <label htmlFor="start_time">Начало</label>
                                <input id="start_time" type="datetime-local" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} />
                                {errors.start_time && <div className="booking-error">{errors.start_time}</div>}
                            </div>

                            <div className="booking-field">
                                <label htmlFor="end_time">Конец</label>
                                <input id="end_time" type="datetime-local" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} />
                                {errors.end_time && <div className="booking-error">{errors.end_time}</div>}
                            </div>

                            <div className="booking-field">
                                <label htmlFor="notes">Комментарий (необязательно)</label>
                                <textarea
                                    id="notes"
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Пожелания гостя, детский стул, аллергии..."
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                />
                                {errors.notes && <div className="booking-error">{errors.notes}</div>}
                            </div>

                            {editingId && (
                                <div className="booking-field">
                                    <label htmlFor="status">Статус</label>
                                    <select id="status" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="booking-modal-actions" style={{ justifyContent: editingId ? 'space-between' : 'flex-end' }}>
                                {editingId && (
                                    <button type="button" className="booking-btn" style={{ color: '#E5484D', borderColor: '#E5484D' }} onClick={handleDelete}>
                                        Удалить
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" className="booking-btn" onClick={closeModal}>Отмена</button>
                                    <button type="submit" className="booking-btn-primary" disabled={processing}>
                                        {editingId ? 'Сохранить' : 'Добавить'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
