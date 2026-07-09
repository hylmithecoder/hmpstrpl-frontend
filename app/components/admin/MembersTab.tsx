'use client';

import React, { useState, useRef } from 'react';
import { VStack, Heading, Text, Card, Button, TextInput, Badge, Avatar, HStack } from '@astryxdesign/core';
import { FiTrash, FiEdit } from 'react-icons/fi';
import {
    apiAdminMutate,
    type Member,
    type Division,
    type Position,
    type ManagementYear,
    API_ORIGIN,
    resolvePhoto,
} from '../../utils/api';

const NEW_POSITION_VALUE = '__new_position__';
const NEW_DIVISION_VALUE = '__new_division__';

interface MembersTabProps {
    members: Member[];
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
    divisions: Division[];
    setDivisions: React.Dispatch<React.SetStateAction<Division[]>>;
    positions: Position[];
    setPositions: React.Dispatch<React.SetStateAction<Position[]>>;
    years: ManagementYear[];
    setStats: React.Dispatch<React.SetStateAction<any>>;
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

export default function MembersTab({ members, setMembers, divisions, setDivisions, positions, setPositions, years, setStats, setBanner }: MembersTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [editUuid, setEditUuid] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [nim, setNim] = useState('');
    const [position, setPosition] = useState('');
    const [newPositionName, setNewPositionName] = useState('');
    const [division, setDivision] = useState('');
    const [newDivisionName, setNewDivisionName] = useState('');
    const [year, setYear] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setName('');
        setNim('');
        setPosition('');
        setNewPositionName('');
        setDivision('');
        setNewDivisionName('');
        setYear('');
        setPhotoFile(null);
        setPhotoPreview(null);
        setEditUuid(null);
        setShowForm(false);
    };

    const handleFileChange = (file: File | null) => {
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPhotoFile(null);
            setPhotoPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !position) {
            setBanner('error', 'Nama dan Jabatan wajib diisi.');
            return;
        }

        const selectedYearObj = years.find(y => y.slug === year) || years[0];

        let selectedDivObj = divisions.find(d => d.name === division) || divisions[0];
        if (division === NEW_DIVISION_VALUE) {
            const divName = newDivisionName.trim();
            if (!divName) {
                setBanner('error', 'Nama divisi baru wajib diisi.');
                return;
            }
            const alias = divName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
            const existingDiv = divisions.find(d => d.name.toLowerCase() === divName.toLowerCase() || d.alias.toLowerCase() === alias);
            if (existingDiv) {
                selectedDivObj = existingDiv;
            } else {
                const divResult = await apiAdminMutate<Division>('/admin/divisions', 'POST', { name: divName, alias });
                if (!divResult.success || !divResult.data) {
                    setBanner('error', divResult.message || 'Gagal membuat divisi baru.');
                    return;
                }
                selectedDivObj = divResult.data;
                setDivisions(prev => [...prev, divResult.data!]);
                setStats((prev: any) => ({ ...prev, totalDivisions: prev.totalDivisions + 1 }));
            }
        }

        let selectedPosObj = positions.find(p => p.name === position) || positions[0];
        if (position === NEW_POSITION_VALUE) {
            const posName = newPositionName.trim();
            if (!posName) {
                setBanner('error', 'Nama jabatan baru wajib diisi.');
                return;
            }
            const existing = positions.find(p => p.name.toLowerCase() === posName.toLowerCase());
            if (existing) {
                selectedPosObj = existing;
            } else {
                const posResult = await apiAdminMutate<Position>('/admin/positions', 'POST', { name: posName });
                if (!posResult.success || !posResult.data) {
                    setBanner('error', posResult.message || 'Gagal membuat jabatan baru.');
                    return;
                }
                selectedPosObj = posResult.data;
                setPositions(prev => [...prev, posResult.data!]);
            }
        }

        const formData = new FormData();
        formData.append('name', name);
        if (nim) formData.append('nim', nim);
        if (selectedDivObj) formData.append('division_id', selectedDivObj.id.toString());
        if (selectedPosObj) formData.append('position_id', selectedPosObj.id.toString());
        if (selectedYearObj) formData.append('managementyear_id', selectedYearObj.id.toString());
        if (photoFile) formData.append('photo', photoFile);
        formData.append('bio', 'Anggota staf pengurus baru HMPS TRPL.');

        let result;
        if (editUuid) {
            result = await apiAdminMutate<Member>(`/admin/members/${editUuid}`, 'PUT', formData);
        } else {
            result = await apiAdminMutate<Member>('/admin/members', 'POST', formData);
        }

        if (result.success) {
            const updatedMember = result.data || {
                uuid: editUuid || `m-${members.length + 1}`,
                name,
                nim,
                position: selectedPosObj || { id: 1, name: position },
                division: selectedDivObj || { id: 1, name: division, alias: division.toLowerCase() },
                managementyear: selectedYearObj ? {
                    id: selectedYearObj.id,
                    start_year: selectedYearObj.start_year,
                    end_year: selectedYearObj.end_year,
                    slug: selectedYearObj.slug
                } : undefined,
                bio: 'Anggota staf pengurus baru HMPS TRPL.',
                photo: photoFile ? URL.createObjectURL(photoFile) : ''
            };

            if (editUuid) {
                setMembers(members.map(m => m.uuid === editUuid ? updatedMember : m));
                setBanner('success', 'Data anggota berhasil diperbarui!');
            } else {
                setMembers([updatedMember, ...members]);
                setStats((prev: any) => ({ ...prev, totalMembers: prev.totalMembers + 1 }));
                setBanner('success', 'Anggota pengurus baru berhasil ditambahkan!');
            }
            resetForm();
        } else {
            setBanner('error', result.message);
        }
    };

    return (
        <VStack gap={6} align="stretch">
            <HStack justify="between" align="center">
                <Heading level={2} className="text-primary font-sans text-xl">Daftar Anggota</Heading>
                <Button
                    variant={showForm ? 'secondary' : 'primary'}
                    size="md"
                    label={showForm ? 'Batal' : 'Tambah Anggota'}
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setShowForm(true);
                        }
                    }}
                />
            </HStack>

            {showForm && (
                <Card variant="muted" padding={5}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                                label="Nama Lengkap"
                                value={name}
                                onChange={setName}
                                isRequired={true}
                            />
                            <VStack gap={2} align="stretch">
                                <Text type="label" className="text-primary text-sm font-semibold">Jabatan</Text>
                                <select
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-primary text-sm focus:outline-none"
                                >
                                    <option value="">Pilih jabatan...</option>
                                    {positions.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                    <option value={NEW_POSITION_VALUE}>+ Buat Jabatan Baru…</option>
                                </select>
                                {position === NEW_POSITION_VALUE && (
                                    <TextInput
                                        label="Nama Jabatan Baru"
                                        value={newPositionName}
                                        onChange={setNewPositionName}
                                        isRequired={true}
                                    />
                                )}
                            </VStack>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <VStack gap={2} align="stretch">
                                <Text type="label" className="text-primary text-sm font-semibold">Divisi</Text>
                                <select
                                    value={division}
                                    onChange={(e) => setDivision(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-primary text-sm focus:outline-none"
                                >
                                    <option value="">Pilih divisi...</option>
                                    {divisions.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                    <option value={NEW_DIVISION_VALUE}>+ Buat Divisi Baru…</option>
                                </select>
                                {division === NEW_DIVISION_VALUE && (
                                    <TextInput
                                        label="Nama Divisi Baru"
                                        value={newDivisionName}
                                        onChange={setNewDivisionName}
                                        isRequired={true}
                                    />
                                )}
                            </VStack>
                            <VStack gap={2} align="stretch">
                                <Text type="label" className="text-primary text-sm font-semibold">Periode Kepengurusan</Text>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-primary text-sm focus:outline-none"
                                >
                                    {years.map(y => (
                                        <option key={y.id} value={y.slug}>{y.slug}</option>
                                    ))}
                                </select>
                            </VStack>
                        </div>

                        {/* Photo Upload - Styled Dropzone */}
                        <VStack gap={2} align="stretch">
                            <Text type="label" className="text-primary text-sm font-semibold">Foto Anggota</Text>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileChange(e.target.files[0]);
                                    }
                                }}
                            />
                            {photoPreview ? (
                                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-border group">
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { handleFileChange(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full max-w-xs border-2 border-dashed border-border rounded-xl py-6 px-4 text-center hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer bg-transparent"
                                >
                                    <VStack gap={1} align="center">
                                        <Text type="body" color="secondary" className="text-sm">Klik untuk unggah foto</Text>
                                        <Text type="supporting" color="disabled" className="text-xs">JPG, PNG, maks 2MB</Text>
                                    </VStack>
                                </button>
                            )}
                        </VStack>

                        <Button type="submit" variant="primary" size="md" label={editUuid ? "Update Anggota" : "Simpan Anggota"} />
                    </form>
                </Card>
            )}

            <div className="border border-border rounded-xl bg-surface">
                <VStack gap={0} align="stretch">
                    {members.map(m => (
                        <div key={m.uuid} className="p-4 border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                            <HStack justify="between" align="center" wrap="wrap" gap={3}>
                                <HStack gap={3} align="center">
                                    <Avatar name={m.name} size="small" src={resolvePhoto(m.photo)} />
                                    <VStack gap={1}>
                                        <Text type="body" weight="bold" className="text-primary text-sm">{m.name}</Text>
                                        <HStack gap={2} align="center" wrap="wrap">
                                            <Badge variant="blue" label={m.position?.name || 'Staf'} />
                                            <Text type="supporting" color="secondary" className="text-xs">{m.division?.name}</Text>
                                            {m.managementyear?.slug && (
                                                <Badge variant="neutral" label={`Periode ${m.managementyear.slug}`} />
                                            )}
                                        </HStack>
                                    </VStack>
                                </HStack>
                                <HStack gap={2}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        label=""
                                        onClick={() => {
                                            setEditUuid(m.uuid);
                                            setName(m.name);
                                            setNim(m.nim || '');
                                            setPosition(m.position?.name || '');
                                            setNewPositionName('');
                                            setDivision(m.division?.name || divisions[0]?.name);
                                            setNewDivisionName('');
                                            setYear(m.managementyear?.slug || years[0]?.slug);
                                            setPhotoFile(null);
                                            setPhotoPreview(null);
                                            setShowForm(true);
                                        }}
                                    >
                                        <FiEdit size={16} color="blue" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        label=""
                                        onClick={async () => {
                                            const res = await apiAdminMutate(`/admin/members/${m.uuid}`, 'DELETE');
                                            if (res.success) {
                                                setMembers(members.filter(item => item.uuid !== m.uuid));
                                                setStats((prev: any) => ({ ...prev, totalMembers: Math.max(0, prev.totalMembers - 1) }));
                                                setBanner('success', 'Anggota berhasil dihapus.');
                                            } else {
                                                setBanner('error', res.message);
                                            }
                                        }}
                                    >
                                        <FiTrash size={16} color="red" />
                                    </Button>
                                </HStack>
                            </HStack>
                        </div>
                    ))}
                </VStack>
            </div>
        </VStack>
    );
}
