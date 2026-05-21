from app.models.major import Major

UIT_MAJOR_SEED_DATA = [
    {
        "code": "7480101",
        "name": "Khoa học máy tính",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A",
        "description": "Mô tả tổng quan: Ngành đào tạo về nền tảng khoa học máy tính, thuật toán, hệ thống và công nghệ phần mềm.",
    },
    {
        "code": "7480107",
        "name": "Trí tuệ nhân tạo",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A",
        "description": "Mô tả tổng quan: Ngành tập trung vào AI, machine learning, deep learning và các ứng dụng trí tuệ nhân tạo.",
    },
    {
        "code": "7480102",
        "name": "Mạng máy tính và truyền thông dữ liệu",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A, T-S-TH",
        "description": "Mô tả tổng quan: Ngành đào tạo về mạng máy tính, hạ tầng truyền thông, hệ thống phân tán và an toàn mạng.",
    },
    {
        "code": "7480103",
        "name": "Kỹ thuật phần mềm",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A",
        "description": "Mô tả tổng quan: Ngành đào tạo về quy trình phát triển phần mềm, kiến trúc phần mềm, kiểm thử và quản lý dự án phần mềm.",
    },
    {
        "code": "7480104",
        "name": "Hệ thống thông tin",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A, T-S-A",
        "description": "Mô tả tổng quan: Ngành đào tạo về hệ thống thông tin, cơ sở dữ liệu, phân tích nghiệp vụ và chuyển đổi số.",
    },
    {
        "code": "7480104_TT",
        "name": "Hệ thống thông tin - chương trình tiên tiến",
        "admission_blocks": "T-L-A, T-V-A, T-A-TH, T-H-A, T-S-A",
        "description": "Mô tả tổng quan: Chương trình tiên tiến của ngành Hệ thống thông tin.",
    },
    {
        "code": "7340122",
        "name": "Thương mại điện tử",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A",
        "description": "Mô tả tổng quan: Ngành kết hợp công nghệ thông tin, kinh doanh số, thương mại điện tử và phân tích dữ liệu.",
    },
    {
        "code": "7480201",
        "name": "Công nghệ thông tin",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A",
        "description": "Mô tả tổng quan: Ngành đào tạo kiến thức rộng về công nghệ thông tin, phát triển hệ thống và ứng dụng CNTT.",
    },
    {
        "code": "7480201_VN",
        "name": "Công nghệ thông tin Việt - Nhật",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A, T-V-N",
        "description": "Mô tả tổng quan: Chương trình Công nghệ thông tin định hướng Việt - Nhật.",
    },
    {
        "code": "7460108",
        "name": "Khoa học dữ liệu",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A, T-L-S",
        "description": "Mô tả tổng quan: Ngành tập trung vào dữ liệu, thống kê, machine learning, khai phá dữ liệu và hệ thống dữ liệu lớn.",
    },
    {
        "code": "7480202",
        "name": "An toàn thông tin",
        "admission_blocks": "T-L-H, T-L-A, T-V-A, T-A-TH, T-L-TH, T-H-A",
        "description": "Mô tả tổng quan: Ngành đào tạo về bảo mật hệ thống, an ninh mạng, mã hóa, điều tra số và bảo vệ thông tin.",
    },
    {
        "code": "7480106",
        "name": "Kỹ thuật máy tính",
        "admission_blocks": "T-L-H, T-L-A, T-L-TH, T-A-TH",
        "description": "Mô tả tổng quan: Ngành kết hợp phần cứng, phần mềm, hệ thống nhúng, IoT và kiến trúc máy tính.",
    },
    {
        "code": "752020A1",
        "name": "Thiết kế vi mạch",
        "admission_blocks": "T-L-H, T-L-A, T-L-TH, T-A-TH",
        "description": "Mô tả tổng quan: Ngành đào tạo về thiết kế chip, vi mạch, hệ thống số và công nghệ bán dẫn.",
    },
    {
        "code": "7320104",
        "name": "Truyền thông Đa phương tiện",
        "admission_blocks": "T-L-A, T-V-A, T-A-TH, T-SU-A, T-Đ-A, T-V-TH",
        "description": "Mô tả tổng quan: Ngành kết hợp công nghệ, thiết kế, truyền thông số, nội dung đa phương tiện và tương tác người dùng.",
    },
]


def seed_uit_majors(db):
    inserted = 0
    updated = 0

    for item in UIT_MAJOR_SEED_DATA:
        payload = {
            **item,
            "fee": "Chưa cập nhật",
        }
        major = db.query(Major).filter(Major.code == item["code"]).first()

        if major:
            for field, value in payload.items():
                setattr(major, field, value)
            updated += 1
            continue

        db.add(Major(**payload))
        inserted += 1

    db.commit()

    return {
        "inserted": inserted,
        "updated": updated,
        "skipped": 0,
        "total": len(UIT_MAJOR_SEED_DATA),
        "todo": "Add international joint programs later if product scope requires.",
    }
