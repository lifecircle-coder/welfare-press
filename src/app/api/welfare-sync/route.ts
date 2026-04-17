import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runWelfareDataFactory } from '@/lib/api/welfare-factory';

export async function GET(request: Request) {
    // 보안을 위해 단순 GET 요청 시 API 키 확인 등을 추가할 수 있으나,
    // 현재는 관리자 수동 동기화용으로 간단히 구현합니다.
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.GEMINI_API_KEY?.substring(0, 10)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await runWelfareDataFactory();
        
        // 데이터 갱신 후 pSEO 페이지 캐시 강제 무효화
        revalidatePath('/welfare/regions/[slug]', 'page');
        revalidatePath('/sitemap.xml');
        
        return NextResponse.json({ success: true, message: 'Sync and Revalidation completed' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
