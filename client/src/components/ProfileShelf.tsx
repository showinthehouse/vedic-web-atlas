import { useState } from "react";
import { BookmarkPlus, Check, LoaderCircle, LogIn, LogOut, Pencil, Trash2, UsersRound, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export type ProfileChartInput = {
  date: string; time: string; gender: "FEMALE" | "MALE" | "UNSPECIFIED"; calendar: "GREGORIAN" | "JULIAN"; placeName: string;
  latitude: number; longitude: number; timezone: number; timeZoneId?: string;
  ayanamsa: "LAHIRI" | "RAMAN" | "KP" | "TRUE_PUSHYA"; divisionalFactor: number;
};

type StoredProfile = ProfileChartInput & { id: number; label: string; notes: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  current: ProfileChartInput;
  onLoad: (profile: StoredProfile) => void;
  onCompare: (left: ProfileChartInput, right: ProfileChartInput, labels: [string, string]) => void;
};

function toProfile(raw: { id: number; label: string; birthDate: string; birthTime: string; gender: "FEMALE" | "MALE" | "UNSPECIFIED"; calendar: "GREGORIAN" | "JULIAN"; placeName: string; latitude: string; longitude: string; timezone: string; timeZoneId: string | null; ayanamsa: "LAHIRI" | "RAMAN" | "KP" | "TRUE_PUSHYA"; divisionalFactor: number; notes: string | null }): StoredProfile {
  return { id: raw.id, label: raw.label, date: raw.birthDate, time: raw.birthTime, gender: raw.gender, calendar: raw.calendar, placeName: raw.placeName, latitude: Number(raw.latitude), longitude: Number(raw.longitude), timezone: Number(raw.timezone), timeZoneId: raw.timeZoneId ?? undefined, ayanamsa: raw.ayanamsa, divisionalFactor: raw.divisionalFactor, notes: raw.notes };
}

export function ProfileShelf({ open, onClose, current, onLoad, onCompare }: Props) {
  const { isAuthenticated, loading } = useAuth();
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const utils = trpc.useUtils();
  const profiles = trpc.profiles.list.useQuery(undefined, { enabled: isAuthenticated });
  const create = trpc.profiles.create.useMutation({ onSuccess: () => { setLabel(""); setNotes(""); utils.profiles.list.invalidate(); } });
  const update = trpc.profiles.update.useMutation({ onSuccess: () => { setLabel(""); setNotes(""); setEditingId(null); utils.profiles.list.invalidate(); } });
  const remove = trpc.profiles.delete.useMutation({ onSuccess: () => utils.profiles.list.invalidate() });
  const register = trpc.auth.register.useMutation({ onSuccess: () => { setPassword(""); utils.auth.me.invalidate(); } });
  const login = trpc.auth.login.useMutation({ onSuccess: () => { setPassword(""); utils.auth.me.invalidate(); } });
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => { utils.auth.me.invalidate(); utils.profiles.list.invalidate(); setCompareIds([]); } });

  if (!open) return null;
  const profileList = (profiles.data ?? []).map(toProfile);
  const toggleCompare = (id: number) => setCompareIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id].slice(-2));
  const selected = profileList.filter(profile => compareIds.includes(profile.id));

  return <aside className="profile-shelf" aria-label="出生档案">
    <div className="profile-shelf-head"><div><span className="section-tag">PRIVATE WORKSPACE</span><h2>出生档案</h2></div><button onClick={onClose} aria-label="关闭档案"><X size={18} /></button></div>
    {loading ? <div className="profile-empty"><LoaderCircle className="spin" size={22} /> 正在检查登录状态…</div> : !isAuthenticated ? <div className="profile-empty auth-panel"><UsersRound size={28} /><h3>{authMode === "login" ? "登录并保存档案" : "创建一个简单账号"}</h3><p>只需用户名和密码；密码不会以明文保存。</p><input value={username} onChange={event => setUsername(event.target.value)} placeholder="用户名（3–48 位）" autoComplete="username" /><input value={password} onChange={event => setPassword(event.target.value)} placeholder="密码（至少 8 位）" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} /><button className="shelf-primary" disabled={!username || !password || login.isPending || register.isPending} onClick={() => authMode === "login" ? login.mutate({ username, password }) : register.mutate({ username, password })}>{login.isPending || register.isPending ? <LoaderCircle size={15} className="spin" /> : <LogIn size={15} />}{authMode === "login" ? "登录" : "注册并登录"}</button>{(login.error || register.error) && <small className="auth-error">{login.error?.message || register.error?.message}</small>}<button className="auth-switch" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "没有账号？注册" : "已有账号？登录"}</button></div> : <>
      <section className="profile-save"><span className="section-tag">{editingId ? "EDIT SAVED PROFILE" : "SAVE CURRENT INPUT"}</span><label>档案名称<input value={label} onChange={event => setLabel(event.target.value)} placeholder="例如：本人本命盘" /></label><label>研究备注（可选）<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="来源、时间校验或研究用途" rows={2} /></label><button className="shelf-primary" disabled={!label.trim() || create.isPending || update.isPending} onClick={() => editingId ? update.mutate({ ...current, id: editingId, label: label.trim(), notes: notes || undefined }) : create.mutate({ ...current, label: label.trim(), notes: notes || undefined })}>{create.isPending || update.isPending ? <LoaderCircle size={15} className="spin" /> : <BookmarkPlus size={15} />} {editingId ? "更新当前资料" : "保存当前资料"}</button>{editingId && <button className="shelf-cancel" onClick={() => { setEditingId(null); setLabel(""); setNotes(""); }}>取消编辑</button>}</section>
      <section className="profile-list"><div className="profile-list-title"><span className="section-tag">SAVED PROFILES</span><span>{profileList.length} 份</span></div>{profiles.isLoading ? <div className="profile-empty"><LoaderCircle size={20} className="spin" /></div> : profileList.length === 0 ? <p className="profile-list-empty">尚无档案。先为当前出生资料命名并保存。</p> : profileList.map(profile => <article className={compareIds.includes(profile.id) ? "profile-card selected" : "profile-card"} key={profile.id}><div><b>{profile.label}</b><span>{profile.date} · {profile.placeName} · {{ FEMALE: "女", MALE: "男", UNSPECIFIED: "未说明" }[profile.gender]}</span></div><div className="profile-card-actions"><button onClick={() => { onLoad(profile); onClose(); }}>载入</button><button onClick={() => { onLoad(profile); setEditingId(profile.id); setLabel(profile.label); setNotes(profile.notes ?? ""); }} aria-label={`编辑 ${profile.label}`}><Pencil size={13} /></button><button className={compareIds.includes(profile.id) ? "picked" : ""} onClick={() => toggleCompare(profile.id)}>{compareIds.includes(profile.id) ? <Check size={13} /> : "比较"}</button><button aria-label={`删除 ${profile.label}`} onClick={() => { if (window.confirm(`删除「${profile.label}」？`)) remove.mutate({ id: profile.id }); }}><Trash2 size={13} /></button></div></article>)}</section>
      <button className="compare-button" disabled={selected.length !== 2} onClick={() => { if (selected.length === 2) { onCompare(selected[0], selected[1], [selected[0].label, selected[1].label]); onClose(); } }}><UsersRound size={16} /> {selected.length === 2 ? `比较：${selected[0].label} × ${selected[1].label}` : "选择两份档案进行比较"}</button><button className="auth-switch" onClick={() => logout.mutate()}><LogOut size={13} /> 退出 {"账户"}</button>
    </>}
  </aside>;
}
