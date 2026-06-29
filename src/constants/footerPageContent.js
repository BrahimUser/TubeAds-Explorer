/**
 * Contenu multilingue des pages informatives du footer.
 * fr = référence ; en / ar = traductions pour l’interface i18n.
 */
import { DEFAULT_LANGUAGE } from '../i18n';

const PAGES = {
  '/qui-sommes-nous': {
    fr: {
      title: 'Qui sommes-nous',
      description:
        'Marketplace est la plateforme marocaine qui met en relation acheteurs et vendeurs via des annonces vidéo, le chat et la commande en ligne.',
      sections: [
        {
          title: 'Notre mission',
          paragraphs: [
            'Nous simplifions l’achat et la vente entre particuliers et professionnels au Maroc. Chaque annonce peut inclure une vidéo pour présenter le produit avec transparence, comme en magasin.',
            'Notre objectif : une expérience locale, mobile-first et de confiance — de Casablanca à Agadir, en passant par Rabat, Fès et Marrakech.',
          ],
        },
        {
          title: 'Ce que nous proposons',
          list: [
            'Publication d’annonces avec photos et vidéos',
            'Boutiques professionnelles (comptes Pro) pour les vendeurs réguliers',
            'Messagerie intégrée entre acheteurs et vendeurs',
            'Commandes avec livraison à domicile ou retrait sur place',
            'Paiement en espèces ou par carte, selon le vendeur',
          ],
        },
        {
          title: 'Nos valeurs',
          paragraphs: [
            'Transparence, respect des utilisateurs et modération des annonces font partie de notre engagement quotidien. Une équipe basée au Maroc accompagne les vendeurs et répond aux acheteurs.',
          ],
        },
      ],
    },
    en: {
      title: 'About us',
      description:
        'Marketplace is the Moroccan platform connecting buyers and sellers through video listings, chat, and online ordering.',
      sections: [
        {
          title: 'Our mission',
          paragraphs: [
            'We make buying and selling easier for individuals and professionals across Morocco. Every listing can include a video so products are shown clearly and honestly.',
            'Our goal is a local, mobile-first, trustworthy experience — from Casablanca to Agadir, Rabat, Fès, and Marrakech.',
          ],
        },
        {
          title: 'What we offer',
          list: [
            'Listings with photos and videos',
            'Pro shop accounts for regular sellers',
            'Built-in messaging between buyers and sellers',
            'Orders with home delivery or pickup',
            'Cash or card payment, depending on the seller',
          ],
        },
        {
          title: 'Our values',
          paragraphs: [
            'Transparency, respect for users, and listing moderation are central to what we do. A Morocco-based team supports sellers and assists buyers.',
          ],
        },
      ],
    },
    ar: {
      title: 'من نحن',
      description:
        'Marketplace هي المنصة المغربية التي تربط المشترين والبائعين عبر إعلانات الفيديو والدردشة والطلب عبر الإنترنت.',
      sections: [
        {
          title: 'مهمتنا',
          paragraphs: [
            'نسهّل البيع والشراء بين الأفراد والمحترفين في المغرب. يمكن لكل إعلان أن يتضمن فيديو لعرض المنتج بوضوح.',
            'هدفنا تجربة محلية موثوقة وموجهة للهاتف — من الدار البيضاء إلى أكادير مروراً بالرباط وفاس ومراكش.',
          ],
        },
        {
          title: 'ما نقدمه',
          list: [
            'إعلانات مع صور وفيديو',
            'متاجر احترافية (حسابات Pro) للبائعين',
            'مراسلة مدمجة بين المشتري والبائع',
            'طلبات مع توصيل منزلي أو استلام من المتجر',
            'الدفع نقداً أو بالبطاقة حسب البائع',
          ],
        },
        {
          title: 'قيمنا',
          paragraphs: [
            'الشفافية واحترام المستخدمين ومراقبة الإعلانات جزء من التزامنا اليومي. فريق مغربي يرافق البائعين ويجيب المشترين.',
          ],
        },
      ],
    },
  },

  '/carrieres': {
    fr: {
      title: 'Carrières',
      description:
        'Rejoignez une équipe qui construit le commerce en ligne au Maroc. Nous recrutons des profils tech, produit, support et commercial.',
      sections: [
        {
          title: 'Pourquoi nous rejoindre',
          paragraphs: [
            'Marketplace est en pleine croissance. Vous travaillerez sur un produit utilisé au quotidien par des vendeurs et des acheteurs marocains, avec un impact direct sur l’économie locale.',
          ],
        },
        {
          title: 'Profils recherchés',
          list: [
            'Développeurs full-stack (React, Node.js)',
            'Product managers et designers UX',
            'Chargés de support client (français / arabe)',
            'Responsables partenariats et vente B2B (comptes Pro)',
            'Modérateurs de contenu et trust & safety',
          ],
        },
        {
          title: 'Candidature spontanée',
          paragraphs: [
            'Envoyez votre CV et une courte motivation à careers@marketplace.ma. Nous étudions chaque candidature et recontactons les profils correspondant à nos besoins actuels.',
          ],
        },
      ],
    },
    en: {
      title: 'Careers',
      description:
        'Join a team building e-commerce in Morocco. We hire across engineering, product, support, and commercial roles.',
      sections: [
        {
          title: 'Why join us',
          paragraphs: [
            'Marketplace is growing fast. You will work on a product used daily by Moroccan sellers and buyers, with a direct impact on the local economy.',
          ],
        },
        {
          title: 'Roles we hire for',
          list: [
            'Full-stack developers (React, Node.js)',
            'Product managers and UX designers',
            'Customer support (French / Arabic)',
            'Partnerships and B2B sales (Pro accounts)',
            'Content moderation and trust & safety',
          ],
        },
        {
          title: 'Open application',
          paragraphs: [
            'Send your CV and a short cover letter to careers@marketplace.ma. We review every application and contact candidates who match our current needs.',
          ],
        },
      ],
    },
    ar: {
      title: 'وظائف',
      description:
        'انضم إلى فريق يبني التجارة الإلكترونية في المغرب. نوظف في التقنية والمنتج والدعم والمبيعات.',
      sections: [
        {
          title: 'لماذا تنضم إلينا',
          paragraphs: [
            'Marketplace في نمو مستمر. ستعمل على منتج يستخدمه البائعون والمشترون المغاربة يومياً، مع أثر مباشر على الاقتصاد المحلي.',
          ],
        },
        {
          title: 'الملفات المطلوبة',
          list: [
            'مطورون full-stack (React, Node.js)',
            'مديرو منتج ومصممو UX',
            'دعم العملاء (فرنسية / عربية)',
            'شراكات ومبيعات B2B (حسابات Pro)',
            'مراقبة المحتوى والأمان',
          ],
        },
        {
          title: 'ترشيح مفتوح',
          paragraphs: [
            'أرسل سيرتك ورسالة قصيرة إلى careers@marketplace.ma. ندرس كل طلب ونتواصل مع الملفات المناسبة.',
          ],
        },
      ],
    },
  },

  '/presse': {
    fr: {
      title: 'Presse',
      description:
        'Espace réservé aux journalistes et médias : actualités, chiffres clés et contacts presse Marketplace.',
      sections: [
        {
          title: 'Contact presse',
          paragraphs: [
            'Pour toute demande d’interview, dossier de presse ou visuel haute définition : presse@marketplace.ma',
            'Délai de réponse habituel : 2 jours ouvrés.',
          ],
        },
        {
          title: 'À propos de la marque',
          paragraphs: [
            'Marketplace est une place de marché vidéo au Maroc, permettant aux particuliers et professionnels de vendre avec des annonces enrichies (vidéo, photos, chat, commande).',
          ],
        },
        {
          title: 'Ressources',
          list: [
            'Logo et charte : sur demande à presse@marketplace.ma',
            'Communiqués : disponibles sur nos réseaux sociaux officiels',
            'Chiffres et témoignages vendeurs : fournis au cas par cas',
          ],
        },
      ],
    },
    en: {
      title: 'Press',
      description:
        'For journalists and media: news, key facts, and Marketplace press contacts.',
      sections: [
        {
          title: 'Press contact',
          paragraphs: [
            'For interviews, press kits, or high-resolution assets: presse@marketplace.ma',
            'Typical response time: 2 business days.',
          ],
        },
        {
          title: 'About the brand',
          paragraphs: [
            'Marketplace is a video marketplace in Morocco, helping individuals and professionals sell with rich listings (video, photos, chat, orders).',
          ],
        },
        {
          title: 'Resources',
          list: [
            'Logo and brand guidelines: on request at presse@marketplace.ma',
            'Press releases: on our official social channels',
            'Metrics and seller stories: provided case by case',
          ],
        },
      ],
    },
    ar: {
      title: 'الصحافة',
      description:
        'مساحة للصحفيين والإعلام: أخبار وأرقام واتصالات Marketplace الإعلامية.',
      sections: [
        {
          title: 'اتصال إعلامي',
          paragraphs: [
            'للطلبات والمقابلات والمواد الإعلامية: presse@marketplace.ma',
            'مدة الرد المعتادة: يومان عمل.',
          ],
        },
        {
          title: 'عن العلامة',
          paragraphs: [
            'Marketplace سوق فيديو في المغرب يربط البائعين والمشترين عبر إعلانات غنية (فيديو، صور، دردشة، طلب).',
          ],
        },
        {
          title: 'موارد',
          list: [
            'الشعار والهوية: عند الطلب على presse@marketplace.ma',
            'بيانات صحفية: على شبكاتنا الرسمية',
            'أرقام وشهادات: حسب الطلب',
          ],
        },
      ],
    },
  },

  '/aide': {
    fr: {
      title: "Centre d'aide",
      description:
        'Réponses aux questions fréquentes et coordonnées pour contacter le support Marketplace.',
      sections: [
        {
          title: 'Questions fréquentes',
          paragraphs: [
            'Comment publier une annonce ? Créez un compte, connectez-vous, puis utilisez le bouton de dépôt d’annonce. Ajoutez titre, prix, ville, catégorie, photos et éventuellement une vidéo.',
            'Comment contacter un vendeur ? Ouvrez une annonce et utilisez la messagerie. Une conversation est créée automatiquement pour chaque annonce.',
            'Comment passer commande ? Sur une annonce éligible, choisissez livraison ou retrait, renseignez vos coordonnées et validez. Le vendeur confirme ensuite la commande.',
          ],
        },
        {
          title: 'Compte et sécurité',
          list: [
            'Inscription par numéro de téléphone marocain (+212)',
            'Mot de passe personnel — ne le partagez jamais',
            'Déconnexion possible à tout moment depuis le menu compte',
          ],
        },
        {
          title: 'Nous contacter',
          paragraphs: [
            'E-mail : support@marketplace.ma',
            'Horaires : lundi – samedi, 9h – 18h (heure de Casablanca)',
            'Pour un litige sur une commande, joignez le numéro de commande (ex. ORD-…) dans votre message.',
          ],
        },
      ],
    },
    en: {
      title: 'Help center',
      description:
        'Frequently asked questions and how to reach Marketplace support.',
      sections: [
        {
          title: 'FAQ',
          paragraphs: [
            'How do I post a listing? Create an account, sign in, then use the post listing flow. Add title, price, city, category, photos, and optionally a video.',
            'How do I contact a seller? Open a listing and use messaging. A thread is created per listing and buyer.',
            'How do I place an order? On an eligible listing, choose delivery or pickup, enter your details, and confirm. The seller then confirms the order.',
          ],
        },
        {
          title: 'Account & security',
          list: [
            'Sign up with a Moroccan phone number (+212)',
            'Personal password — never share it',
            'Sign out anytime from the account menu',
          ],
        },
        {
          title: 'Contact us',
          paragraphs: [
            'Email: support@marketplace.ma',
            'Hours: Monday – Saturday, 9am – 6pm (Casablanca time)',
            'For order disputes, include your order number (e.g. ORD-…) in your message.',
          ],
        },
      ],
    },
    ar: {
      title: 'مركز المساعدة',
      description:
        'إجابات على الأسئلة الشائعة وكيفية التواصل مع دعم Marketplace.',
      sections: [
        {
          title: 'أسئلة شائعة',
          paragraphs: [
            'كيف أنشر إعلاناً؟ أنشئ حساباً، سجّل الدخول، ثم أضف عنواناً وسعراً ومدينة وفئة وصوراً وفيديو إن أمكن.',
            'كيف أتواصل مع البائع؟ افتح الإعلان واستخدم المراسلة.',
            'كيف أطلب؟ اختر التوصيل أو الاستلام، أدخل بياناتك وأكد. يؤكد البائع الطلب لاحقاً.',
          ],
        },
        {
          title: 'الحساب والأمان',
          list: [
            'التسجيل برقم مغربي (+212)',
            'كلمة مرور شخصية — لا تشاركها',
            'تسجيل الخروج متاح من قائمة الحساب',
          ],
        },
        {
          title: 'اتصل بنا',
          paragraphs: [
            'البريد: support@marketplace.ma',
            'الأوقات: الاثنين – السبت، 9 – 18 (توقيت الدار البيضاء)',
            'للنزاعات، أرفق رقم الطلب (مثل ORD-…).',
          ],
        },
      ],
    },
  },

  '/conditions-utilisation': {
    fr: {
      title: "Conditions d'utilisation",
      description:
        'Règles d’utilisation de la plateforme Marketplace pour les acheteurs et les vendeurs au Maroc.',
      sections: [
        {
          title: '1. Objet',
          paragraphs: [
            'Les présentes conditions régissent l’accès et l’utilisation du site et des services Marketplace. En créant un compte, vous les acceptez sans réserve.',
          ],
        },
        {
          title: '2. Comptes utilisateurs',
          list: [
            'Vous devez fournir des informations exactes (téléphone, nom affiché)',
            'Un compte est personnel ; vous êtes responsable de son utilisation',
            'Marketplace peut suspendre un compte en cas de fraude ou de non-respect des règles',
          ],
        },
        {
          title: '3. Annonces et contenu',
          paragraphs: [
            'Les vendeurs garantissent que leurs annonces sont licites, exactes et qu’ils détiennent les droits sur les photos et vidéos publiées. Sont interdits : produits illégaux, contrefaçons, contenus trompeurs ou offensants.',
            'Marketplace se réserve le droit de modérer, refuser ou retirer toute annonce sans préavis en cas de violation.',
          ],
        },
        {
          title: '4. Transactions',
          paragraphs: [
            'Marketplace met en relation acheteurs et vendeurs. Le contrat de vente est conclu directement entre eux. La plateforme n’est pas partie au contrat de vente, sauf mention contraire explicite.',
          ],
        },
        {
          title: '5. Droit applicable',
          paragraphs: [
            'Les présentes conditions sont régies par le droit marocain. Tout litige relève des tribunaux compétents du Royaume du Maroc.',
            'Dernière mise à jour : juin 2026.',
          ],
        },
      ],
    },
    en: {
      title: 'Terms of use',
      description:
        'Rules for using the Marketplace platform for buyers and sellers in Morocco.',
      sections: [
        {
          title: '1. Purpose',
          paragraphs: [
            'These terms govern access to and use of the Marketplace website and services. By creating an account, you accept them in full.',
          ],
        },
        {
          title: '2. User accounts',
          list: [
            'You must provide accurate information (phone, display name)',
            'An account is personal; you are responsible for its use',
            'Marketplace may suspend accounts for fraud or rule violations',
          ],
        },
        {
          title: '3. Listings and content',
          paragraphs: [
            'Sellers warrant that listings are lawful, accurate, and that they own rights to published media. Prohibited: illegal goods, counterfeits, misleading or offensive content.',
            'Marketplace may moderate, reject, or remove listings without notice if rules are broken.',
          ],
        },
        {
          title: '4. Transactions',
          paragraphs: [
            'Marketplace connects buyers and sellers. The sale contract is between them directly. The platform is not a party to the sale unless explicitly stated otherwise.',
          ],
        },
        {
          title: '5. Governing law',
          paragraphs: [
            'These terms are governed by Moroccan law. Disputes fall under competent courts in the Kingdom of Morocco.',
            'Last updated: June 2026.',
          ],
        },
      ],
    },
    ar: {
      title: 'شروط الاستخدام',
      description:
        'قواعد استخدام منصة Marketplace للمشترين والبائعين في المغرب.',
      sections: [
        {
          title: '1. الموضوع',
          paragraphs: [
            'تحكم هذه الشروط الوصول إلى موقع Marketplace وخدماته. بإنشاء حساب، تقبلها بالكامل.',
          ],
        },
        {
          title: '2. حسابات المستخدمين',
          list: [
            'يجب تقديم معلومات دقيقة (هاتف، اسم العرض)',
            'الحساب شخصي وأنت مسؤول عن استخدامه',
            'يجوز لـ Marketplace تعليق الحساب عند الاحتيال أو مخالفة القواعد',
          ],
        },
        {
          title: '3. الإعلانات والمحتوى',
          paragraphs: [
            'يضمن البائعون أن إعلاناتهم قانونية ودقيقة وأن لهم حقوق الوسائط المنشورة. ممنوع: سلع غير قانونية، تقليد، محتوى مضلل أو مسيء.',
            'يجوز لـ Marketplace مراجعة أو رفض أو حذف إعلان دون إشعار عند المخالفة.',
          ],
        },
        {
          title: '4. المعاملات',
          paragraphs: [
            'Marketplace يربط المشتري والبائع. عقد البيع بينهما مباشرة. المنصة ليست طرفاً في البيع ما لم يُنص صراحة على خلاف ذلك.',
          ],
        },
        {
          title: '5. القانون المعمول به',
          paragraphs: [
            'تخضع هذه الشروط للقانون المغربي. النزاعات أمام المحاكم المختصة في المملكة المغربية.',
            'آخر تحديث: يونيو 2026.',
          ],
        },
      ],
    },
  },

  '/politique-confidentialite': {
    fr: {
      title: 'Politique de confidentialité',
      description:
        'Comment Marketplace collecte, utilise et protège vos données personnelles.',
      sections: [
        {
          title: 'Données collectées',
          list: [
            'Numéro de téléphone et nom affiché (compte)',
            'Annonces, messages, commandes et favoris',
            'Données techniques (appareil, logs de connexion) pour la sécurité',
          ],
        },
        {
          title: 'Finalités',
          paragraphs: [
            'Vos données servent à créer et gérer votre compte, afficher vos annonces, faciliter le chat et les commandes, prévenir la fraude et améliorer le service.',
            'Nous ne vendons pas vos données personnelles à des tiers à des fins publicitaires.',
          ],
        },
        {
          title: 'Conservation et sécurité',
          paragraphs: [
            'Les données sont hébergées sur des serveurs sécurisés. Les mots de passe sont stockés sous forme chiffrée (hachage).',
            'Vous pouvez demander la rectification ou la suppression de votre compte en écrivant à privacy@marketplace.ma, sous réserve des obligations légales de conservation.',
          ],
        },
        {
          title: 'Vos droits',
          paragraphs: [
            'Conformément à la loi marocaine n° 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel, vous disposez d’un droit d’accès, de rectification et d’opposition.',
            'Dernière mise à jour : juin 2026.',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy policy',
      description:
        'How Marketplace collects, uses, and protects your personal data.',
      sections: [
        {
          title: 'Data we collect',
          list: [
            'Phone number and display name (account)',
            'Listings, messages, orders, and favorites',
            'Technical data (device, connection logs) for security',
          ],
        },
        {
          title: 'Purposes',
          paragraphs: [
            'Your data is used to manage your account, show listings, enable chat and orders, prevent fraud, and improve the service.',
            'We do not sell your personal data to third parties for advertising.',
          ],
        },
        {
          title: 'Retention and security',
          paragraphs: [
            'Data is stored on secured servers. Passwords are stored hashed.',
            'You may request correction or deletion by emailing privacy@marketplace.ma, subject to legal retention requirements.',
          ],
        },
        {
          title: 'Your rights',
          paragraphs: [
            'Under Moroccan law n° 09-08 on personal data protection, you have rights of access, rectification, and objection.',
            'Last updated: June 2026.',
          ],
        },
      ],
    },
    ar: {
      title: 'سياسة الخصوصية',
      description:
        'كيف تجمع Marketplace بياناتك الشخصية وتستخدمها وتحميها.',
      sections: [
        {
          title: 'البيانات المجمعة',
          list: [
            'رقم الهاتف واسم العرض (الحساب)',
            'الإعلانات والرسائل والطلبات والمفضلة',
            'بيانات تقنية (جهاز، سجلات) للأمان',
          ],
        },
        {
          title: 'الأغراض',
          paragraphs: [
            'تُستخدم بياناتك لإدارة حسابك وعرض الإعلانات وتفعيل الدردشة والطلبات ومنع الاحتيال وتحسين الخدمة.',
            'لا نبيع بياناتك الشخصية لأطراف ثالثة للإعلان.',
          ],
        },
        {
          title: 'الحفظ والأمان',
          paragraphs: [
            'تُخزَّن البيانات على خوادم آمنة. كلمات المرور مشفرة (تجزئة).',
            'يمكنك طلب التصحيح أو الحذف عبر privacy@marketplace.ma وفق الالتزامات القانونية.',
          ],
        },
        {
          title: 'حقوقك',
          paragraphs: [
            'وفق القانون المغربي 09-08 لحماية المعطيات الشخصية، لك حق الوصول والتصحيح والاعتراض.',
            'آخر تحديث: يونيو 2026.',
          ],
        },
      ],
    },
  },

  '/service-livraison': {
    fr: {
      title: 'Livraison',
      description:
        'Modes de livraison et retrait disponibles sur Marketplace au Maroc.',
      sections: [
        {
          title: 'Livraison à domicile',
          paragraphs: [
            'Lors du passage de commande, vous pouvez choisir la livraison à domicile si le vendeur la propose. Indiquez nom complet, téléphone, adresse, ville et code postal.',
            'Les frais de livraison sont affichés avant validation et ajoutés au total de la commande (en dirhams MAD).',
          ],
        },
        {
          title: 'Retrait chez le vendeur',
          paragraphs: [
            'Vous pouvez aussi choisir le retrait sur place (pickup). Convenez du lieu et de l’horaire avec le vendeur via la messagerie.',
            'Aucun frais de livraison n’est appliqué en mode retrait, sauf accord contraire avec le vendeur.',
          ],
        },
        {
          title: 'Délais indicatifs',
          list: [
            'Grandes villes (Casablanca, Rabat, Marrakech) : souvent 2 à 5 jours ouvrés',
            'Autres villes : 3 à 10 jours ouvrés selon le transporteur ou le vendeur',
            'Les délais exacts dépendent du vendeur et sont confirmés après validation de la commande',
          ],
        },
        {
          title: 'Suivi',
          paragraphs: [
            'Le statut de votre commande (en attente, confirmée, expédiée) est visible dans votre espace commandes. En cas de question, contactez le vendeur ou le support.',
          ],
        },
      ],
    },
    en: {
      title: 'Delivery',
      description:
        'Delivery and pickup options available on Marketplace in Morocco.',
      sections: [
        {
          title: 'Home delivery',
          paragraphs: [
            'When placing an order, you can choose home delivery if the seller offers it. Enter full name, phone, address, city, and postal code.',
            'Delivery fees are shown before checkout and added to the order total (MAD).',
          ],
        },
        {
          title: 'Pickup',
          paragraphs: [
            'You may choose pickup at the seller’s location. Agree on place and time via messaging.',
            'No delivery fee applies for pickup unless otherwise agreed with the seller.',
          ],
        },
        {
          title: 'Typical timelines',
          list: [
            'Major cities (Casablanca, Rabat, Marrakech): often 2–5 business days',
            'Other cities: 3–10 business days depending on carrier or seller',
            'Exact timing is confirmed by the seller after order confirmation',
          ],
        },
        {
          title: 'Tracking',
          paragraphs: [
            'Order status (pending, confirmed, shipped) appears in your orders area. Contact the seller or support if needed.',
          ],
        },
      ],
    },
    ar: {
      title: 'التوصيل',
      description:
        'خيارات التوصيل والاستلام على Marketplace في المغرب.',
      sections: [
        {
          title: 'التوصيل للمنزل',
          paragraphs: [
            'عند الطلب يمكنك اختيار التوصيل للمنزل إن وفره البائع. أدخل الاسم والهاتف والعنوان والمدينة والرمز البريدي.',
            'تُعرض رسوم التوصيل قبل التأكيد وتُضاف إلى المجموع (درهم).',
          ],
        },
        {
          title: 'الاستلام من البائع',
          paragraphs: [
            'يمكن اختيار الاستلام من عند البائع. اتفق على المكان والوقت عبر المراسلة.',
            'لا رسوم توصيل في وضع الاستلام ما لم يتفق البائع على خلاف ذلك.',
          ],
        },
        {
          title: 'مدد تقريبية',
          list: [
            'المدن الكبرى: غالباً 2–5 أيام عمل',
            'مدن أخرى: 3–10 أيام حسب الناقل أو البائع',
            'يؤكد البائع المدة بعد تأكيد الطلب',
          ],
        },
        {
          title: 'المتابعة',
          paragraphs: [
            'حالة الطلب (قيد الانتظار، مؤكد، مشحون) تظهر في مساحة الطلبات. تواصل مع البائع أو الدعم عند الحاجة.',
          ],
        },
      ],
    },
  },

  '/paiement-securise': {
    fr: {
      title: 'Paiement sécurisé',
      description:
        'Moyens de paiement acceptés sur Marketplace et mesures de sécurité.',
      sections: [
        {
          title: 'Moyens de paiement',
          list: [
            'Espèces (paiement à la livraison ou au retrait, selon accord avec le vendeur)',
            'Carte bancaire (lorsque proposé par le vendeur à la commande)',
            'Tous les montants sont affichés en dirhams (MAD)',
          ],
        },
        {
          title: 'Sécurité',
          paragraphs: [
            'Les échanges sensibles passent par une connexion chiffrée (HTTPS). Les données de carte ne sont pas stockées sur nos serveurs lorsque le paiement est traité par un prestataire certifié.',
            'Ne communiquez jamais votre mot de passe Marketplace ou vos codes bancaires par message ou e-mail.',
          ],
        },
        {
          title: 'Bonnes pratiques',
          list: [
            'Vérifiez le montant total avant de confirmer une commande',
            'Privilégiez la messagerie intégrée pour les échanges avec le vendeur',
            'Signalez toute demande de paiement suspecte au support',
          ],
        },
      ],
    },
    en: {
      title: 'Secure payment',
      description:
        'Payment methods accepted on Marketplace and security measures.',
      sections: [
        {
          title: 'Payment methods',
          list: [
            'Cash (on delivery or pickup, as agreed with the seller)',
            'Card (when offered by the seller at checkout)',
            'All amounts are shown in Moroccan dirhams (MAD)',
          ],
        },
        {
          title: 'Security',
          paragraphs: [
            'Sensitive traffic uses encrypted connections (HTTPS). Card data is not stored on our servers when processed by a certified provider.',
            'Never share your Marketplace password or bank codes via message or email.',
          ],
        },
        {
          title: 'Best practices',
          list: [
            'Check the total amount before confirming an order',
            'Use in-app messaging to talk to sellers',
            'Report suspicious payment requests to support',
          ],
        },
      ],
    },
    ar: {
      title: 'الدفع الآمن',
      description:
        'طرق الدفع المقبولة على Marketplace وإجراءات الأمان.',
      sections: [
        {
          title: 'طرق الدفع',
          list: [
            'نقداً (عند التوصيل أو الاستلام حسب الاتفاق)',
            'بطاقة (عندما يعرضها البائع عند الطلب)',
            'جميع المبالغ بالدرهم المغربي (MAD)',
          ],
        },
        {
          title: 'الأمان',
          paragraphs: [
            'الاتصالات الحساسة مشفرة (HTTPS). لا نخزن بيانات البطاقة على خوادمنا عند المعالجة عبر مزود معتمد.',
            'لا تشارك كلمة مرور Marketplace أو رموز البنك عبر الرسائل أو البريد.',
          ],
        },
        {
          title: 'ممارسات جيدة',
          list: [
            'تحقق من المجموع قبل تأكيد الطلب',
            'استخدم المراسلة داخل التطبيق',
            'أبلغ الدعم عن أي طلب دفع مشبوه',
          ],
        },
      ],
    },
  },

  '/protection-acheteur': {
    fr: {
      title: 'Protection acheteur',
      description:
        'Nos engagements pour sécuriser vos achats et résoudre les litiges sur Marketplace.',
      sections: [
        {
          title: 'Avant l’achat',
          paragraphs: [
            'Consultez la vidéo et les photos de l’annonce, lisez la description et échangez avec le vendeur via le chat avant de commander. Vérifiez la réputation du vendeur (boutique Pro, ancienneté des annonces).',
          ],
        },
        {
          title: 'Pendant la commande',
          list: [
            'Conservez le numéro de commande et l’historique des messages',
            'Le vendeur doit confirmer la commande avant expédition',
            'En cas d’annulation, le statut « annulée » est visible dans votre espace',
          ],
        },
        {
          title: 'Litiges et remboursements',
          paragraphs: [
            'En cas de produit non conforme, non reçu ou endommagé, contactez d’abord le vendeur. Si aucune solution n’est trouvée sous 7 jours, écrivez à support@marketplace.ma avec preuves (photos, numéro de commande, échanges).',
            'Notre équipe examine chaque dossier et peut mediariser selon nos règles internes. Les remboursements dépendent du mode de paiement et de la situation constatée.',
          ],
        },
        {
          title: 'Signalement',
          paragraphs: [
            'Annonces frauduleuses ou comportements abusifs peuvent être signalés via le support ou la modération. Nous pouvons retirer une annonce et suspendre un compte en cas de manquement grave.',
          ],
        },
      ],
    },
    en: {
      title: 'Buyer protection',
      description:
        'Our commitments to secure your purchases and resolve disputes on Marketplace.',
      sections: [
        {
          title: 'Before you buy',
          paragraphs: [
            'Review listing video and photos, read the description, and chat with the seller before ordering. Check seller profile (Pro shop, listing history).',
          ],
        },
        {
          title: 'During the order',
          list: [
            'Keep your order number and message history',
            'The seller must confirm the order before shipping',
            'Cancellations show as “cancelled” in your orders area',
          ],
        },
        {
          title: 'Disputes and refunds',
          paragraphs: [
            'If the item is wrong, missing, or damaged, contact the seller first. If unresolved within 7 days, email support@marketplace.ma with evidence (photos, order number, messages).',
            'Our team reviews each case and may mediate under internal rules. Refunds depend on payment method and findings.',
          ],
        },
        {
          title: 'Reporting',
          paragraphs: [
            'Fraudulent listings or abuse can be reported to support or moderation. We may remove listings and suspend accounts for serious violations.',
          ],
        },
      ],
    },
    ar: {
      title: 'حماية المشتري',
      description:
        'التزاماتنا لتأمين مشترياتك وحل النزاعات على Marketplace.',
      sections: [
        {
          title: 'قبل الشراء',
          paragraphs: [
            'راجع الفيديو والصور والوصف وتحدث مع البائع قبل الطلب. تحقق من ملف البائع (متجر Pro، سجل الإعلانات).',
          ],
        },
        {
          title: 'أثناء الطلب',
          list: [
            'احتفظ برقم الطلب وسجل الرسائل',
            'يجب على البائع تأكيد الطلب قبل الشحن',
            'الإلغاء يظهر «ملغى» في مساحة الطلبات',
          ],
        },
        {
          title: 'النزاعات والاسترداد',
          paragraphs: [
            'إن كان المنتج غير مطابق أو لم يصل أو تالف، تواصل مع البائع أولاً. إن لم يُحل خلال 7 أيام، راسل support@marketplace.ma مع الأدلة.',
            'يفحص فريقنا كل ملف وقد يتوسط وفق قواعدنا. الاسترداد يعتمد على طريقة الدفع والوضع.',
          ],
        },
        {
          title: 'الإبلاغ',
          paragraphs: [
            'يمكن الإبلاغ عن إعلانات احتيالية أو سلوك مسيء للدعم أو المراجعة. قد نحذف إعلاناً أو نعلق حساباً عند مخالفة جسيمة.',
          ],
        },
      ],
    },
  },
};

const LANGS = ['ar', 'en', 'fr'];

export function getFooterPageContent(path, lang = DEFAULT_LANGUAGE) {
  const page = PAGES[path];
  if (!page) return null;
  const code = String(lang || DEFAULT_LANGUAGE).split('-')[0].toLowerCase();
  return page[LANGS.includes(code) ? code : DEFAULT_LANGUAGE];
}

/** Titres + descriptions FR pour les info-bulles du footer (compat). */
export const FOOTER_PAGE_CONTENT = Object.fromEntries(
  Object.entries(PAGES).map(([path, locales]) => {
    const fr = locales.fr;
    return [path, { title: fr.title, description: fr.description }];
  }),
);

export const FOOTER_INFO_PATHS = new Set(Object.keys(PAGES));
