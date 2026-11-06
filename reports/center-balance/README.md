# 밸런스 검증 기록

최신 기준은 **6년·24턴·총 10개 센터·2/4/6년 종합평가**입니다.

- [최신 종합 해석: SIX_YEAR_REVIEW.md](SIX_YEAR_REVIEW.md)
- [훈련 324게임](six-year-training.md)
- [독립 holdout 324게임](six-year-holdout.md)
- [신중구매 보조실험 12게임](six-year-cautious.md)

전체 데이터는 동명 `.json.gz`, 요약 수치는 `.csv`에 보관합니다. 원본 `.json`은 프로젝트의 `.preview/balance-traces/`에 비파괴 이동하여 보존했습니다. 압축 전후 바이트 일치를 검증했습니다. 재실행·압축본 읽기 방법은 종합 해석 문서에 있습니다.

`baseline.*`와 `tuned.*`는 이전 5년·20턴 규칙의 역사적 보관본이며 현재 밸런스 결론으로 인용하지 않습니다.
