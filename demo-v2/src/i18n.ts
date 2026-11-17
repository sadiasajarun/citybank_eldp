/**
 * Bangla / English UI (FR 193). Keys are the English text; `t()` returns the Bangla text when the language is BN and
 * a translation exists, otherwise the English text. Covered: the top bar and menus, dashboard headings and KPI labels,
 * and the employee learning screens. Other text stays English in the demo.
 */
import { useDemo } from './store';

const BN: Record<string, string> = {
  // shell
  Home: 'হোম', Modules: 'মডিউল', People: 'কর্মীবৃন্দ', Reports: 'রিপোর্ট', 'My tasks': 'আমার কাজ', Search: 'খুঁজুন', 'Log out': 'লগ আউট',
  'Viewing as': 'দেখছেন', Notifications: 'নোটিফিকেশন',
  // menu groups and items
  'My work': 'আমার কাজ', 'My learning': 'আমার শিক্ষা', 'My development': 'আমার উন্নয়ন', 'My team': 'আমার টিম', 'My division': 'আমার বিভাগ',
  'Learning hub': 'লার্নিং হাব', 'My calendar': 'আমার ক্যালেন্ডার', 'My courses': 'আমার কোর্স', 'My training': 'আমার ট্রেনিং', 'Assessments': 'মূল্যায়ন',
  Feedback: 'ফিডব্যাক', Certificates: 'সার্টিফিকেট', 'My record': 'আমার রেকর্ড', Competencies: 'দক্ষতা', 'Learning journey': 'লার্নিং জার্নি',
  'Development requests': 'উন্নয়ন অনুরোধ', 'Exams & assessments': 'পরীক্ষা ও মূল্যায়ন', Administration: 'প্রশাসন', Competency: 'দক্ষতা',
  // dashboards
  'Good morning': 'শুভ সকাল', 'Good afternoon': 'শুভ অপরাহ্ন', 'Good evening': 'শুভ সন্ধ্যা',
  'HR & L&D Operations Dashboard': 'এইচআর ও এলঅ্যান্ডডি অপারেশনস ড্যাশবোর্ড', 'Training management overview': 'ট্রেনিং ব্যবস্থাপনার সারসংক্ষেপ',
  'City Bank training lifecycle (5-step flow)': 'সিটি ব্যাংক ট্রেনিং লাইফসাইকেল (৫ ধাপ)', 'Click any stage to continue the workflow': 'যেকোনো ধাপে ক্লিক করে কাজ চালিয়ে যান',
  'Training requests': 'ট্রেনিং অনুরোধ', 'Division need & auto ID': 'বিভাগীয় চাহিদা ও স্বয়ংক্রিয় আইডি', Nominations: 'মনোনয়ন', 'Conflict & leave check': 'দ্বন্দ্ব ও ছুটি যাচাই',
  'Schedule & attendance': 'সময়সূচি ও উপস্থিতি', 'Venue, Teams & expense': 'ভেন্যু, টিমস ও ব্যয়', 'Withdrawals & bonds': 'প্রত্যাহার ও বন্ড', 'Replacement & legal print': 'প্রতিস্থাপন ও আইনি প্রিন্ট',
  'Training database': 'ট্রেনিং ডাটাবেস', 'Unified record & import': 'একীভূত রেকর্ড ও ইমপোর্ট',
  'Total trainings (2026)': 'মোট ট্রেনিং (২০২৬)', 'Training investment (BDT)': 'ট্রেনিং বিনিয়োগ (টাকা)', 'Avg completion rate': 'গড় সমাপ্তির হার', 'Active bond liability': 'সক্রিয় বন্ড দায়',
  'Training investment vs target': 'ট্রেনিং বিনিয়োগ বনাম লক্ষ্য', 'Training programme status': 'ট্রেনিং প্রোগ্রামের অবস্থা', 'Active & upcoming training batches': 'চলমান ও আসন্ন ট্রেনিং ব্যাচ',
  'AI-suggested trainings & compliance deadline risk': 'এআই-প্রস্তাবিত ট্রেনিং ও কমপ্লায়েন্স ঝুঁকি', 'Operational queue': 'কাজের সারি', 'Recent activity': 'সাম্প্রতিক কার্যক্রম',
  'Full report': 'পূর্ণ রিপোর্ট', 'All batches': 'সব ব্যাচ', 'Review & schedule': 'পর্যালোচনা ও সময়সূচি', '+ Schedule batch': '+ ব্যাচ নির্ধারণ',
  // employee learning
  'My Learning and Development': 'আমার শিক্ষা ও উন্নয়ন', 'Enrolled courses': 'নিবন্ধিত কোর্স', 'Average progress': 'গড় অগ্রগতি', 'Completed & certified': 'সম্পন্ন ও সার্টিফাইড',
  'Mandatory compliance': 'বাধ্যতামূলক কমপ্লায়েন্স', 'Continue where you left off': 'যেখানে থেমেছিলেন সেখান থেকে শুরু করুন', 'Resume lesson': 'পাঠ আবার শুরু', 'Review course': 'কোর্স পর্যালোচনা',
  'My learning goals': 'আমার শেখার লক্ষ্য', 'Upcoming': 'আসন্ন', 'Latest results': 'সর্বশেষ ফলাফল', 'Points & badges': 'পয়েন্ট ও ব্যাজ', Leaderboard: 'লিডারবোর্ড',
  'Course catalog': 'কোর্স ক্যাটালগ', 'Learning paths': 'লার্নিং পাথ', 'Course management': 'কোর্স ব্যবস্থাপনা', Bookmarks: 'বুকমার্ক', Downloads: 'ডাউনলোড',
  'Discussion forum': 'আলোচনা ফোরাম', 'Exams & results': 'পরীক্ষা ও ফলাফল', Calendar: 'ক্যালেন্ডার', 'Saved & offline': 'সংরক্ষিত ও অফলাইন',
  Mandatory: 'বাধ্যতামূলক', 'Learning this year': 'এই বছরের শিক্ষা', 'Current focus': 'বর্তমান লক্ষ্য', hours: 'ঘণ্টা', 'Set a goal': 'লক্ষ্য নির্ধারণ',
};

export type Lang = 'en' | 'bn';
export const translate = (lang: Lang, key: string): string => (lang === 'bn' ? BN[key] ?? key : key);
/** Hook: `const t = useT(); t('Home')`. */
export function useT() {
  const lang = useDemo((s) => s.lang);
  return (key: string) => translate(lang, key);
}
/** Digits in Bangla when BN (for KPI values that are plain numbers). */
export const bnDigits = (lang: Lang, v: string | number) => (lang === 'bn' ? String(v).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]) : String(v));
