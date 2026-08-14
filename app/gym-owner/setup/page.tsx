'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function GymSetup() { const router = useRouter(); const [form, setForm] = useState({ name: '', owner_name: '', owner_phone: '', address: '', city_area: '' }); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value })); async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); const { data: { user } } = await supabase.auth.getUser(); if (!user) return router.replace('/gym-owner/login'); const { error } = await supabase.from('gyms').insert({ ...form, owner_id: user.id }); if (error) setError(error.message); else router.replace('/gym-owner/dashboard'); setBusy(false) } return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4"><Card className="w-full max-w-lg"><CardHeader><div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Building2 /></div><CardTitle className="pt-4 text-2xl">Set up your gym</CardTitle><CardDescription>Tell us a few details so your owner workspace is ready.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-4">{[['name','Gym name',true],['owner_name','Your name',true],['owner_phone','Phone number',true],['address','Address',true],['city_area','City / area',false]].map(([key, label, required]) => <div className="flex flex-col gap-2" key={key as string}><Label htmlFor={key as string}>{label as string}</Label><Input id={key as string} required={required as boolean} value={form[key as keyof typeof form]} onChange={e => update(key as string, e.target.value)} /></div>)}{error && <p className="text-sm text-destructive">{error}</p>}<Button disabled={busy} className="mt-2">{busy && <Loader2 className="animate-spin" data-icon="inline-start" />}Continue to dashboard</Button></form></CardContent></Card></main> }
