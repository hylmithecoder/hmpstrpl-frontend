'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Card,
  TextInput,
  TextArea,
  Banner,
  Divider
} from '@astryxdesign/core';
import { submitContact } from '../utils/api';

export default function ContactForm() {
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [bannerStatus, setBannerStatus] = useState<'success' | 'error' | null>(null);
  const [bannerMsg, setBannerMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      setBannerStatus('error');
      setBannerMsg('Semua kolom wajib diisi kecuali Nomor Telepon.');
      return;
    }

    setSubmitting(true);
    setBannerStatus(null);

    const result = await submitContact({
      name,
      email,
      phone,
      subject,
      message
    });

    setSubmitting(false);
    if (result.success) {
      setBannerStatus('success');
      setBannerMsg(result.message);
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } else {
      setBannerStatus('error');
      setBannerMsg(result.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-16">
        <VStack gap={10} align="stretch">

          {/* Header */}
          <VStack gap={2} className="border-b border-border pb-8">
            <Badge variant="blue" label="Hubungi Kami" />
            <Heading level={1} type="display-2" className="text-primary font-sans leading-tight tracking-tight">
              Ada Pertanyaan? Hubungi Kami
            </Heading>
            <Text type="body" color="secondary" className="font-sans max-w-2xl">
              Gunakan formulir di bawah ini untuk mengirim pesan langsung ke sekretariat pengurus HMPS TRPL Politeknik Negeri Medan. Kami siap membantu Anda.
            </Text>
          </VStack>

          {/* Form and info details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Form Column */}
            <div className="lg:col-span-2">
              <VStack gap={6} align="stretch">

                {/* Result Notification Banner */}
                {bannerStatus && (
                  <Banner
                    status={bannerStatus}
                    title={bannerStatus === 'success' ? 'Pesan Terkirim' : 'Gagal Mengirim Pesan'}
                    description={bannerMsg}
                    onDismiss={() => setBannerStatus(null)}
                  />
                )}

                <Card variant="default" padding={6}>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextInput
                        label="Nama Lengkap"
                        value={name}
                        onChange={(val) => setName(val)}
                        isRequired={true}
                        placeholder="Masukkan nama Anda..."
                      />

                      <TextInput
                        label="Alamat Email"
                        type="email"
                        value={email}
                        onChange={(val) => setEmail(val)}
                        isRequired={true}
                        placeholder="contoh@email.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextInput
                        label="Nomor Telepon (Opsional)"
                        value={phone}
                        onChange={(val) => setPhone(val)}
                        placeholder="Contoh: 081234567890"
                      />

                      <TextInput
                        label="Subjek Pesan"
                        value={subject}
                        onChange={(val) => setSubject(val)}
                        isRequired={true}
                        placeholder="Topik atau judul pesan..."
                      />
                    </div>

                    <TextArea
                      label="Isi Pesan"
                      value={message}
                      onChange={(val) => setMessage(val)}
                      isRequired={true}
                      placeholder="Tuliskan pesan Anda secara mendetail di sini..."
                      rows={5}
                    />

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        label="Kirim Pesan Sekarang"
                        isLoading={submitting}
                      />
                    </div>
                  </form>
                </Card>
              </VStack>
            </div>

            {/* Info details Column */}
            <div className="lg:col-span-1">
              <VStack gap={6} align="stretch">

                {/* Secretariat Card */}
                <Card variant="muted" padding={5} className="flex flex-col gap-4">
                  <Badge variant="blue" label="Sekretariat" />
                  <Heading level={3} className="text-primary font-sans">HMPS TRPL Polmed</Heading>

                  <VStack gap={2}>
                    <Text type="label" weight="bold" className="text-primary font-sans text-xs uppercase tracking-wider">Alamat:</Text>
                    <Text type="body" color="secondary" className="font-sans leading-relaxed">
                      Gedung Jurusan Elektro, Politeknik Negeri Medan. Jl. Almamater No. 1, Kampus USU Padang Bulan, Medan, Sumatera Utara, 20155.
                    </Text>
                  </VStack>

                  <Divider />

                  <VStack gap={2}>
                    <Text type="label" weight="bold" className="text-primary font-sans text-xs uppercase tracking-wider">Email Resmi:</Text>
                    <Text type="body" color="secondary" className="font-sans leading-relaxed">
                      contact@hmpstrplpolmed.com
                    </Text>
                  </VStack>
                </Card>

                {/* FAQ Card */}
                <Card variant="default" padding={5} className="flex flex-col gap-3">
                  <Badge variant="neutral" label="Tanya Jawab" />
                  <Heading level={3} className="text-primary font-sans">Berapa Lama Balasan Pesan?</Heading>
                  <Text type="body" color="secondary" className="font-sans leading-relaxed text-sm">
                    Tim administrasi kami di Divisi Kestari biasanya menanggapi pesan Anda dalam waktu 1-2 hari kerja setelah pesan masuk. Terima kasih atas pengertian Anda!
                  </Text>
                </Card>

              </VStack>
            </div>

          </div>

        </VStack>
      </main>

      <Footer />
    </div>
  );
}
