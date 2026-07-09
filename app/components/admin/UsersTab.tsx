'use client';

import React, { useEffect, useState } from 'react';
import { VStack, Heading, Text, Card, Button, TextInput, Badge, Avatar, HStack } from '@astryxdesign/core';
import { FiTrash, FiEdit2 } from 'react-icons/fi';
import { apiAdminFetch, apiAdminMutate, type User, type Role } from '../../utils/api';

interface UsersTabProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

const roleName = (r: Role | string) => (typeof r === 'string' ? r : r.name);

export default function UsersTab({ users, setUsers, setBanner }: UsersTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

    useEffect(() => {
        apiAdminFetch<Role[]>('/admin/authorization/roles', []).then(roles => {
            setAvailableRoles(Array.isArray(roles) ? roles : []);
        });
    }, []);

    const currentUserId = (() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem('hmps_auth_user');
            return raw ? (JSON.parse(raw).id as number) : null;
        } catch {
            return null;
        }
    })();

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setEmail('');
        setUsername('');
        setPassword('');
        setBio('');
        setSelectedRoles([]);
    };

    const startEdit = (u: User) => {
        setEditingId(u.id);
        setName(u.name);
        setEmail(u.email);
        setUsername(u.username);
        setPassword('');
        setBio(u.bio || '');
        setSelectedRoles((u.roles ?? []).map(roleName));
        setShowForm(true);
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !username) {
            setBanner('error', 'Nama, Email, dan Username wajib diisi.');
            return;
        }
        if (!editingId && password.length < 6) {
            setBanner('error', 'Password wajib diisi minimal 6 karakter.');
            return;
        }
        if (editingId && password && password.length < 6) {
            setBanner('error', 'Password baru minimal 6 karakter.');
            return;
        }

        const body: Record<string, string> = { name, email, username, bio };
        if (password) body.password = password;

        const result = editingId
            ? await apiAdminMutate<User>(`/admin/users/${editingId}`, 'PUT', body)
            : await apiAdminMutate<User>('/admin/users', 'POST', body);

        if (!result.success) {
            setBanner('error', result.message);
            return;
        }

        const savedUser: User = result.data || {
            id: editingId ?? Math.max(0, ...users.map(u => u.id)) + 1,
            name,
            email,
            username,
            bio
        };

        if (availableRoles.length > 0) {
            const roleResult = await apiAdminMutate(`/admin/users/${savedUser.id}/roles`, 'PUT', {
                roles: selectedRoles
            });
            if (roleResult.success) {
                savedUser.roles = selectedRoles.map(r => ({ name: r }));
            }
        }

        if (editingId) {
            setUsers(users.map(u => (u.id === editingId ? { ...u, ...savedUser } : u)));
            setBanner('success', 'Data user berhasil diperbarui!');
        } else {
            setUsers([...users, savedUser]);
            setBanner('success', 'User baru berhasil dibuat!');
        }
        resetForm();
        setShowForm(false);
    };

    const handleDelete = async (u: User) => {
        if (u.id === currentUserId) {
            setBanner('error', 'Tidak dapat menghapus akun yang sedang digunakan.');
            return;
        }
        const res = await apiAdminMutate(`/admin/users/${u.id}`, 'DELETE');
        if (res.success) {
            setUsers(users.filter(item => item.id !== u.id));
            if (editingId === u.id) {
                resetForm();
                setShowForm(false);
            }
            setBanner('success', 'User berhasil dihapus.');
        } else {
            setBanner('error', res.message);
        }
    };

    return (
        <VStack gap={6} align="stretch">
            <HStack justify="between" align="center">
                <Heading level={2} className="text-primary font-sans text-xl">Manajemen User</Heading>
                <Button
                    variant={showForm ? 'secondary' : 'primary'}
                    size="md"
                    label={showForm ? 'Batal' : 'Buat User Baru'}
                    onClick={() => {
                        if (showForm) resetForm();
                        setShowForm(!showForm);
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
                                placeholder="Contoh: Admin HMPS"
                            />
                            <TextInput
                                label="Username"
                                value={username}
                                onChange={setUsername}
                                isRequired={true}
                                placeholder="Contoh: admin"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                                label="Email"
                                value={email}
                                onChange={setEmail}
                                isRequired={true}
                                placeholder="Contoh: admin@hmpstrpl.com"
                            />
                            <TextInput
                                label={editingId ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
                                value={password}
                                onChange={setPassword}
                                isRequired={!editingId}
                                type="password"
                                placeholder="Minimal 6 karakter"
                            />
                        </div>
                        <TextInput
                            label="Bio"
                            value={bio}
                            onChange={setBio}
                            placeholder="Deskripsi singkat user (opsional)"
                        />
                        {availableRoles.length > 0 && (
                            <VStack gap={2} align="stretch">
                                <Text type="label" className="text-primary text-sm font-semibold">Role</Text>
                                <HStack gap={4} wrap="wrap">
                                    {availableRoles.map(r => (
                                        <label key={r.name} className="flex items-center gap-2 text-sm text-primary cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedRoles.includes(r.name)}
                                                onChange={() => toggleRole(r.name)}
                                            />
                                            {r.name}
                                        </label>
                                    ))}
                                </HStack>
                            </VStack>
                        )}
                        <Button type="submit" variant="primary" size="md" label={editingId ? 'Simpan Perubahan' : 'Simpan User'} />
                    </form>
                </Card>
            )}

            <div className="border border-border rounded-xl bg-surface p-4">
                <VStack gap={3} align="stretch">
                    {users.length === 0 && (
                        <Text type="supporting" color="secondary" className="text-sm">Belum ada user terdaftar.</Text>
                    )}
                    {users.map(u => (
                        <HStack key={u.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <HStack gap={3} align="center">
                                <Avatar name={u.name} size="small" src={u.userimg || undefined} />
                                <VStack gap={0.5}>
                                    <HStack gap={2} align="center" wrap="wrap">
                                        <Text type="body" weight="bold" className="text-primary text-sm">{u.name}</Text>
                                        {(u.roles ?? []).map(r => (
                                            <Badge key={roleName(r)} variant="blue" label={roleName(r)} />
                                        ))}
                                        {u.id === currentUserId && <Badge variant="neutral" label="Anda" />}
                                    </HStack>
                                    <Text type="supporting" color="disabled" className="text-xs font-mono">
                                        @{u.username} · {u.email}
                                    </Text>
                                </VStack>
                            </HStack>
                            <HStack gap={1}>
                                <Button variant="ghost" size="sm" label="" onClick={() => startEdit(u)}>
                                    <FiEdit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" label="" onClick={() => handleDelete(u)}>
                                    <FiTrash size={16} color="red" />
                                </Button>
                            </HStack>
                        </HStack>
                    ))}
                </VStack>
            </div>
        </VStack>
    );
}
