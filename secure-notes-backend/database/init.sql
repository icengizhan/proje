-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1
-- Üretim Zamanı: 29 Nis 2026, 10:59:32
-- Sunucu sürümü: 10.4.32-MariaDB
-- PHP Sürümü: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `secure_notes`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `folders`
--

CREATE TABLE `folders` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `folders`
--

INSERT INTO `folders` (`id`, `name`, `user_id`) VALUES
(1, 'Kişisel', 1),
(2, 'İş', 1),
(3, 'Ders', 1),
(4, 'Ders', 2);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `notes`
--

CREATE TABLE `notes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `is_public` tinyint(4) NOT NULL DEFAULT 0,
  `public_slug` char(36) DEFAULT NULL,
  `folderId` int(11) DEFAULT NULL,
  `isPinned` tinyint(4) NOT NULL DEFAULT 0,
  `isDeleted` tinyint(4) NOT NULL DEFAULT 0,
  `isLocked` tinyint(4) NOT NULL DEFAULT 0,
  `isFavorite` tinyint(4) NOT NULL DEFAULT 0,
  `paperType` varchar(255) NOT NULL DEFAULT 'blank',
  `paperColor` varchar(255) NOT NULL DEFAULT 'white',
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `notes`
--

INSERT INTO `notes` (`id`, `title`, `content`, `is_public`, `public_slug`, `folderId`, `isPinned`, `isDeleted`, `isLocked`, `isFavorite`, `paperType`, `paperColor`, `created_at`, `updated_at`, `user_id`) VALUES
(1, 'Revize Not', 'Uygulama içi geliştirmeler yapılması\n[[JavaScript]] degişiklikler', 0, NULL, 2, 1, 0, 0, 1, 'blank', 'white', '2026-04-22 17:54:29.137460', '2026-04-22 23:26:21.000000', 1),
(2, 'SEO GÜNLÜK İŞ AKIŞI', 'Clinic Sayfaları içerik girişi\nSemrush trafikler\nFeatured İmage ekleme\nFocus Keyword ekleme\nClinic sayfalarını blog sayfalarında iç link olarak ekleme işlemi', 0, NULL, 2, 1, 0, 0, 1, 'lined', 'yellow', '2026-04-22 17:54:29.317672', '2026-04-22 23:26:04.000000', 1),
(3, 'Yüzme Dersi', 'Pazartesi - Çarşamba 19.00- 20.00 [[Tenis Dersleri]] aynı günler ve saatleri degiştir.', 0, NULL, 1, 0, 0, 0, 0, 'blank', 'white', '2026-04-22 17:54:29.466082', '2026-04-22 23:26:13.000000', 1),
(4, 'JavaScript', 'JavaScript (JS), web sitelerini etkileşimli, dinamik ve işlevsel hale getiren, tarayıcı tarafında (istemci) çalışan en temel programlama dilidir. HTML ile yapı, CSS ile tasarım sağlanan sitelere animasyonlar, veri güncellemeleri ve kullanıcı etkileşimleri (tıklama, form kontrolü) ekler. Modern web\'in üç temel teknolojisinden biridir.\n\n![javascript-programming-code-abstract-technology-background.jpg](/uploads/811949d2-6122-47b8-b98c-764c18532038.jpg)\n', 0, NULL, 3, 0, 0, 0, 1, 'dots', 'white', '2026-04-22 17:54:29.605935', '2026-04-22 23:26:16.000000', 1),
(5, 'Tenis Dersleri', 'Pazartesi- Çarşamba 19.00- 20.00 saatleri arasında Bakırköy Tenis kortunda.', 0, NULL, 1, 0, 0, 0, 0, 'grid', 'yellow', '2026-04-22 17:54:29.824120', '2026-04-22 23:26:09.000000', 1),
(6, 'Deneme', '', 0, NULL, NULL, 0, 1, 0, 0, 'blank', 'white', '2026-04-22 22:19:33.482477', '2026-04-22 22:19:39.000000', 1),
(7, 'Deneme', '', 0, NULL, NULL, 0, 1, 0, 0, 'blank', 'white', '2026-04-22 22:19:47.473663', '2026-04-22 22:19:52.000000', 1),
(8, 'Market Alışveriş Listesi', 'Makarna\nSU \nUn\nYoğurt\nMeyve\nDomates\nSalatalık\nİrmik\nKola\n', 0, NULL, NULL, 0, 0, 0, 0, 'blank', 'white', '2026-04-22 23:26:29.172459', '2026-04-22 23:27:32.000000', 1),
(9, 'Yeni NotMy Test Note', 'This is a test note content.', 0, NULL, NULL, 0, 0, 0, 0, 'grid', 'yellow', '2026-04-29 00:39:55.139764', '2026-04-29 00:42:07.000000', 2),
(10, 'Yeni Not', '', 0, NULL, NULL, 0, 0, 0, 0, 'blank', 'white', '2026-04-29 00:42:16.472498', '2026-04-29 00:42:16.472498', 2),
(11, 'Ders', '', 0, NULL, NULL, 0, 0, 0, 0, 'blank', 'white', '2026-04-29 00:42:18.201635', '2026-04-29 00:42:27.000000', 2),
(12, 'Test', '', 0, NULL, NULL, 0, 0, 0, 0, 'blank', 'white', '2026-04-29 00:45:27.329295', '2026-04-29 00:45:44.000000', 2),
(13, 'Yeni Not', '', 0, NULL, NULL, 0, 0, 0, 0, 'blank', 'white', '2026-04-29 00:45:54.980382', '2026-04-29 00:45:54.980382', 2);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `password_hash`, `created_at`, `updated_at`) VALUES
(1, 'icengizhan@valdori.com', 'ilayda cengizhan', '$2b$12$z4QdO68n.hHix9zOabx/6uKWE7SGGDFVkCmIp8sPm7c6DOyvhMYOu', '2026-04-22 17:53:47.835994', '2026-04-22 17:53:47.835994'),
(2, 'test@example.com', 'testuser', '$2b$12$Eec2xRyzF/SXQVhRc4HvzexV0ALIjHKq1y8h8tetNIZfnmjIabszu', '2026-04-29 00:39:46.254101', '2026-04-29 00:39:46.254101');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `folders`
--
ALTER TABLE `folders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_71af7633de585b66b4db26734c9` (`user_id`);

--
-- Tablo için indeksler `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_d4ec490f764323dba690b14556` (`public_slug`),
  ADD KEY `FK_7708dcb62ff332f0eaf9f0743a7` (`user_id`);

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  ADD UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `folders`
--
ALTER TABLE `folders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Tablo için AUTO_INCREMENT değeri `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Tablo için AUTO_INCREMENT değeri `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `folders`
--
ALTER TABLE `folders`
  ADD CONSTRAINT `FK_71af7633de585b66b4db26734c9` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Tablo kısıtlamaları `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `FK_7708dcb62ff332f0eaf9f0743a7` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
