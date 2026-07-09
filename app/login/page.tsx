'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  VStack,
  Heading,
  Text,
  Badge,
  Button,
  Card,
  TextInput,
  Banner
} from '@astryxdesign/core';
import { loginAdmin } from '../utils/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bannerStatus, setBannerStatus] = useState<'success' | 'error' | null>(null);
  const [bannerMsg, setBannerMsg] = useState('');

  // If already logged in, redirect to admin automatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hmps_auth_token');
      if (token) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setBannerStatus('error');
      setBannerMsg('Semua kolom login wajib diisi.');
      return;
    }

    setSubmitting(true);
    setBannerStatus(null);

    const result = await loginAdmin({ email, password });
    setSubmitting(false);

    if (result.success && result.data) {
      // Save JWT token and user info
      localStorage.setItem('hmps_auth_token', result.data.token);
      localStorage.setItem('hmps_auth_user', JSON.stringify(result.data.user));

      setBannerStatus('success');
      setBannerMsg(result.message);

      // Force update navbar state by raising custom storage event
      window.dispatchEvent(new Event('storage'));

      // Redirect to admin dashboard
      router.push('/dashboard');
    } else {
      setBannerStatus('error');
      setBannerMsg(result.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250 font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <VStack gap={6} align="stretch" className="w-full max-w-md">

          {/* Header Description */}
          <div className="text-center">
            <Badge variant="blue" label="Keamanan Situs" />
            <Heading level={1} className="text-primary font-sans mt-3 text-3xl leading-tight">
              Masuk Dashboard
            </Heading>
            <Text type="supporting" color="secondary" className="font-sans mt-1">
              Gunakan akun administrator HMPS TRPL Polmed Anda.
            </Text>
          </div>

          {/* Banner notification */}
          {bannerStatus && (
            <Banner
              status={bannerStatus}
              title={bannerStatus === 'success' ? 'Sukses' : 'Gagal Masuk'}
              description={bannerMsg}
              onDismiss={() => setBannerStatus(null)}
            />
          )}

          {/* Login Card Form */}
          <Card variant="default" padding={6}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <TextInput
                label="Alamat Email"
                type="email"
                value={email}
                onChange={(val) => setEmail(val)}
                isRequired={true}
                placeholder="admin@hmpstrpl.com"
              />

              <TextInput
                label="Kata Sandi"
                type="password"
                value={password}
                onChange={(val) => setPassword(val)}
                isRequired={true}
                placeholder="••••••••"
              />

              <div className="pt-2 justify-center flex">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  label="Masuk Sekarang"
                  isLoading={submitting}
                />
              </div>
            </form>
          </Card>
        </VStack>
      </main>

      <Footer />
    </div>
  );
}
