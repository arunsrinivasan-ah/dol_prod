import pytest
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from services.chat_service import detect_sms_template_intent
from pipeline.company_retrieval import is_doc_compatible_with_vessel, fetch_template_document_data, get_company_template_catalog
from models.database import get_pool

def test_detect_sms_template_intent():
    # Discovery
    assert detect_sms_template_intent("give me sms template")[0] == "DISCOVERY"
    assert detect_sms_template_intent("sms templates")[0] == "DISCOVERY"
    assert detect_sms_template_intent("sms forms")[0] == "DISCOVERY"

    # Specific templates
    assert detect_sms_template_intent("Enclosed Space Entry Permit (SS 004)") == ("SPECIFIC", "Enclosed Space Entry Permit")
    assert detect_sms_template_intent("Cold Work Permit (SS 002)") == ("SPECIFIC", "Cold Work Permit")
    assert detect_sms_template_intent("Enclosed Space Entry Permit") == ("SPECIFIC", "Enclosed Space Entry Permit")
    assert detect_sms_template_intent("Safety Familiarisation Checklist") == ("SPECIFIC", "Safety Familiarisation Checklist")
    assert detect_sms_template_intent("Safety Familiarization Checklist") == ("SPECIFIC", "Safety Familiarisation Checklist")
    assert detect_sms_template_intent("Safety Familiarisation Checklist (SS 006)") == ("SPECIFIC", "Safety Familiarisation Checklist")
    assert detect_sms_template_intent("SS 006") == ("SPECIFIC", "Safety Familiarisation Checklist")
    assert detect_sms_template_intent("SS 004") == ("SPECIFIC", "Enclosed Space Entry Permit")
    assert detect_sms_template_intent("Hot Work Permit (SS 001)") == ("SPECIFIC", "Hot Work Permit")
    assert detect_sms_template_intent("Bunkering Safety Checklist (E05-A)") == ("SPECIFIC", "Bunkering Safety Checklist")
    assert detect_sms_template_intent("Risk Assessment Format (RA 001)") == ("SPECIFIC", "Risk Assessment Format")
    assert detect_sms_template_intent("Personnel Transfer Using Crane") == ("SPECIFIC", "Personnel Transfer Using Crane")
    assert detect_sms_template_intent("Personnel Transfer Using Crane Permit") == ("SPECIFIC", "Personnel Transfer Using Crane")

    # Regular non-template queries should NOT be triggered
    assert detect_sms_template_intent("what is centrifugal pump") == (None, None)
    assert detect_sms_template_intent("what is sms") == (None, None)
    assert detect_sms_template_intent("what are hazards of hot work") == (None, None)
    assert detect_sms_template_intent("what is safety familiarisation") == (None, None)

def test_fetch_template_document_data_for_demo_company():
    import asyncio
    async def _run():
        pool = await get_pool()
        # Test demo user with company_id='8' and ship_type='Container'
        # 1. Enclosed Space
        title, content = await fetch_template_document_data(pool, "8", "Container", "Enclosed Space Entry Permit (SS 004)")
        assert title is not None
        assert content is not None
        assert "ENCLOSED SPACE" in title.upper()
        assert len(content) > 1000

        # 2. Cold Work
        title, content = await fetch_template_document_data(pool, "8", "Container", "Cold Work Permit (SS 002)")
        assert title is not None
        assert content is not None
        assert "COLD WORK" in title.upper()
        assert len(content) > 1000

        # 3. Safety Familiarisation Checklist
        title, content = await fetch_template_document_data(pool, "8", "Container", "Safety Familiarisation Checklist")
        assert title is not None
        assert content is not None
        assert "FAMILIAR" in content.upper() or "SS 006" in content.upper()
        assert len(content) > 500

        # 4. Catalog for company_id='8' and ship_type='Container'
        catalog = await get_company_template_catalog(pool, "8", "Container")
        assert len(catalog) >= 7
        titles = [t[0] for t in catalog]
        assert any("Enclosed Space" in t for t in titles)
        assert any("Cold Work" in t for t in titles)
        assert any("Hot Work" in t for t in titles)

    asyncio.run(_run())
