'use client';

import { useParams } from 'next/navigation';
import { Shield, Book, UserCheck, Copyright } from 'lucide-react';

const POLICY_CONTENT: Record<string, { title: string, icon: any, content: string }> = {
    terms: {
        title: '이용약관',
        icon: <Book className="text-blue-500" />,
        content: `
제 1 조 (목적)
본 약관은 상호명이 운영하는 인터넷 신문(이하 서비스)의 이용조건 및 절차, 회사와 회원 간의 권리와 의무 등 기본적인 사항을 규정함을 목적으로 합니다.

제 2 조 (용어의 정의)
1. 서비스란 회사가 이용자에게 제공하는 뉴스, 정보, 커뮤니티 등의 온라인 서비스를 의미합니다.
2. 회원이란 회사가 제공하는 서비스에 접속하여 본 약관에 따라 이용계약을 체결하고 서비스를 이용하는 고객을 말합니다.
3. 아이디란 회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 문자와 숫자의 조합을 의미합니다.

제 3 조 (약관의 효력 및 변경)
1. 본 약관은 서비스를 통하여 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 관계 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 변경된 약관은 공지사항을 통해 고지합니다.
3. 회원이 개정된 약관에 동의하지 않을 경우 이용계약을 해지할 수 있으며, 계속 이용 시 약관 변경에 동의한 것으로 간주합니다.

제 4 조 (회원 가입 및 계약 성립)
1. 이용계약은 이용자가 약관 내용에 대하여 동의를 하고 가입 신청을 한 후 회사가 이를 승낙함으로써 성립합니다.
2. 회사는 실명이 아니거나 타인의 정보를 도용한 신청에 대하여 승낙을 거절하거나 사후에 계약을 해지할 수 있습니다.

제 5 조 (서비스의 제공 및 중단)
1. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
2. 회사는 시스템 정기점검, 설비 보수, 통신 장애 등 부득이한 사유가 있는 경우 서비스의 전부 또는 일부를 제한하거나 중지할 수 있습니다.

제 6 조 (회사의 의무)
1. 회사는 본 약관이 정하는 바에 따라 지속적이고 안정적인 서비스를 제공하기 위하여 최선을 다합니다.
2. 회사는 서비스 제공과 관련하여 취득한 회원의 개인정보를 본인의 사전 승낙 없이 제3자에게 제공하거나 유출하지 않습니다.

제 7 조 (회원의 의무)
1. 회원은 관계 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다.
2. 회원은 타인의 권익이나 명예를 훼손하거나 서비스의 운영을 방해하는 행위를 해서는 안 됩니다.

제 8 조 (저작권의 귀속 및 이용제한)
1. 회사가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 회사에 귀속됩니다.
2. 이용자는 서비스를 이용하며 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포 등 영리 목적으로 이용하거나 제3자에게 이용하게 해서는 안 됩니다.

제 9 조 (분쟁 해결 및 관할권)
회사의 서비스 이용과 관련하여 발생한 분쟁에 대해서는 회사의 본사 소재지를 관할하는 법원을 전담 관할 법원으로 합니다.
        `
    },
    privacy: {
        title: '개인정보처리방침',
        icon: <Shield className="text-green-500" />,
        content: `
상호명은 이용자의 개인정보를 매우 중요하게 생각하며, 개인정보 보호법에 의거하여 다음과 같은 개인정보 처리방침을 운영하고 있습니다.

제 1 조 (수집하는 개인정보의 항목)
회사는 서비스 제공을 위하여 필요한 최소한의 범위 내에서 아래와 같은 개인정보를 수집하고 있습니다.
1. 회원 가입 시 성명, 전자우편 주소, 비밀번호, 접속 로그 등을 수집합니다.
2. 서비스 이용 과정에서 접속 아이피 정보, 쿠키, 방문 일시 등의 정보가 자동으로 생성되어 수집될 수 있습니다.

제 2 조 (개인정보의 수집 및 이용 목적)
회사는 다음의 목적을 위하여 개인정보를 처리하며, 목적 이외의 용도로는 사용하지 않습니다.
1. 이용자 식별 및 본인 확인, 회원 가입 및 서비스 이용 의사 확인
2. 서비스 제공에 따른 계약 이행 및 콘텐츠 제공, 맞춤 서비스 제공
3. 신규 서비스 개발, 민원 처리 및 고충 해결

제 3 조 (개인정보의 보유 및 이용 기간)
1. 이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 지체 없이 파기합니다.
2. 다만, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 해당 법령이 정한 기간 동안 보관합니다.

제 4 조 (이용자의 권리와 의무)
1. 이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입 해지를 요청할 수 있습니다.
2. 이용자는 자신의 개인정보를 최신의 상태로 유지하여야 하며, 정보 오입력으로 인한 책임은 본인에게 있습니다.

제 5 조 (개인정보 보호 책임자 안내)
개인정보 보호와 관련한 문의사항은 아래의 보호 책임자에게 문의하실 수 있습니다.
관리책임부서 편집국
전자우편 contact@welfarenews.com
        `
    },
    youth: {
        title: '청소년보호정책',
        icon: <UserCheck className="text-orange-500" />,
        content: `
상호명은 청소년이 건전한 인격체로 성장할 수 있도록 정보통신망 이용촉진 및 정보보호 등에 관한 법률에 따라 청소년 보호 정책을 수립하여 시행하고 있습니다.

제 1 조 (청소년 유해 정보로부터의 보호)
회사는 청소년이 유해한 환경에 노출되지 않도록 청소년 유해 매체물에 대하여 별도의 성인 인증 장치를 마련하는 등 엄격한 접근 제한 조치를 취하고 있습니다.

제 2 조 (청소년 보호를 위한 교육 및 업무 수행)
회사는 청소년 보호 담당자 및 서비스 운영자들을 대상으로 관련 법령 및 청소년 유해 정보 발견 시 대처 방법 등에 대한 정기적인 교육을 실시하고 있습니다.

제 3 조 (피해 상담 및 고충 처리)
회사는 청소년 유해 정보로 인한 피해 상담 및 고충 처리를 위하여 전문 인력을 배치하고 피해 확산을 방지하기 위하여 노력하고 있습니다.

제 4 조 (청소년 보호 책임자 지정)
청소년 보호와 관련한 고충이나 건의사항은 아래의 책임자에게 전달해 주시기 바랍니다.
청소년 보호 책임자 편집국장
전자우편 contact@welfarenews.com
        `
    },
    copyright: {
        title: '저작권보호정책',
        icon: <Copyright className="text-red-500" />,
        content: `
상호명이 제공하는 모든 뉴스, 정보 등의 저작권은 회사에 있으며, 이용자들이 이를 무단으로 사용하는 것을 금지합니다.

제 1 조 (뉴스 저작권의 귀속)
회사가 직접 작성한 기사, 사진, 영상 등 모든 콘텐츠에 대한 저작권은 저작권법의 보호를 받으며 회사에 독점적으로 귀속됩니다.

제 2 조 (콘텐츠 이용의 제한)
1. 이용자는 회사의 사전 서면 승낙 없이 콘텐츠를 복제, 배포, 방송, 공중송신하거나 상업적으로 이용할 수 없습니다.
2. 비영리적인 목적으로 기사를 인용하는 경우에도 반드시 출처를 명확히 밝혀야 하며, 기사 전문을 그대로 옮겨 게시하는 행위는 제한됩니다.

제 3 조 (게시물의 책임과 권리)
1. 서비스 내 게시판 등에 이용자가 등록한 게시물의 저작권은 해당 게시자에게 있습니다.
2. 회사는 이용자의 게시물이 제3자의 저작권을 침해하는 경우 사전 통보 없이 해당 게시물을 삭제하거나 수정을 요구할 수 있습니다.

제 4 조 (저작권 침해 신고)
회사의 저작물을 무단으로 사용하거나 타인의 저작권 침해를 발견하신 경우 아래의 연락처로 신고해 주시기 바랍니다.
담당부서 편집국 운영팀
전자우편 contact@welfarenews.com
        `
    }
};

export default function PolicyPage() {
    const params = useParams();
    const type = params.type as string;
    const policy = POLICY_CONTENT[type];

    if (!policy) {
        return <div className="p-20 text-center">존재하지 않는 정책 페이지입니다.</div>;
    }

    return (
        <div className="bg-white min-h-screen py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="overflow-hidden">
                    <div className="pb-10 border-b-2 border-gray-900 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">
                            {policy.icon}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">{policy.title}</h1>
                            <p className="text-gray-500 mt-1 font-medium text-sm">상호명의 공식 운영 정책을 안내해 드립니다.</p>
                        </div>
                    </div>
                    <div className="py-12 prose prose-slate max-w-none whitespace-pre-wrap text-gray-800 leading-8 text-[1.05rem]">
                        {policy.content.trim()}
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center gap-8 text-sm font-bold text-gray-400">
                    <a href="/policy/terms" className={type === 'terms' ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-gray-600 transition-colors'}>이용약관</a>
                    <a href="/policy/privacy" className={type === 'privacy' ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-gray-600 transition-colors'}>개인정보처리방침</a>
                    <a href="/policy/youth" className={type === 'youth' ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-gray-600 transition-colors'}>청소년보호정책</a>
                    <a href="/policy/copyright" className={type === 'copyright' ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-gray-600 transition-colors'}>저작권보호정책</a>
                </div>
            </div>
        </div>
    );
}
