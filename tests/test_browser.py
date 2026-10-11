import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:18917/'
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':390,'height':844})
  errs=[]; page.on('pageerror',lambda e:errs.append(str(e)))
  await page.goto(BASE,timeout=12000)
  await page.wait_for_selector('.module-tab',timeout=5000)
  assert await page.title()=='ORAL LAB | Estúdio de Provas Orais'
  assert await page.locator('.module-tab').count()==6
  assert await page.locator('#collection-select option').count()==1
  assert (await page.locator('.brand-name').inner_text()).startswith('ORAL LAB')
  assert await page.locator('.word').count()>40
  for idx in range(6):
   await page.locator('.module-tab').nth(idx).click()
   for mode in ('short','medium','full'):
    await page.locator(f'[data-mode="{mode}"]').click()
    assert len((await page.locator('#tele-content').inner_text()).strip())>60
  await page.locator('.module-tab').first.click()
  await page.locator('#new-collection').click()
  await page.locator('#collection-name').fill('Direito Constitucional')
  await page.locator('#collection-desc').fill('Treino para banca oral')
  await page.locator('#collection-save').click()
  assert await page.locator('#collection-select option').count()==2
  assert await page.locator('.module-tab').count()==0
  await page.locator('#new-question').click()
  await page.locator('#q-title').fill('Controle de constitucionalidade')
  await page.locator('#q-question').fill('O que é controle concentrado?')
  await page.locator('#q-short').fill('Controle concentrado aprecia constitucionalidade em abstrato.')
  await page.locator('#q-medium').fill('Controle concentrado é julgamento abstrato de constitucionalidade no órgão competente.')
  await page.locator('#q-full').fill('O controle concentrado discute a compatibilidade normativa com a Constituição.')
  await page.locator('#q-arguments').fill('Abstrato\nConcentrado\nCompetência')
  await page.locator('#q-keywords').fill('Constituição, STF, controle')
  await page.locator('#question-save').click()
  assert await page.locator('.module-tab').count()==1
  assert 'concentrado' in (await page.locator('#tele-content').inner_text())
  await page.locator('#edit-button').click()
  await page.locator('#editor-text').fill('RESPOSTA CUSTOMIZADA.')
  await page.locator('#editor-save').click()
  assert (await page.locator('#tele-content').inner_text()).strip()=='RESPOSTA CUSTOMIZADA.'
  await page.reload()
  assert await page.locator('#collection-select').input_value()!='familias-cuidado'
  assert (await page.locator('#tele-content').inner_text()).strip()=='RESPOSTA CUSTOMIZADA.'
  await page.locator('#settings-toggle').click()
  await page.locator('#export-pdf').evaluate('(e)=>{window.print=()=>{};e.click()}')
  assert await page.locator('.print-module').count()==1
  assert 'RESPOSTA CUSTOMIZADA.' in (await page.locator('#print-root').inner_text())
  await page.locator('#settings-close').click()
  await page.locator('#collection-select').select_option('familias-cuidado')
  assert await page.locator('.module-tab').count()==6
  await page.locator('#new-collection').click()
  assert await page.locator('#collection-modal').is_visible()
  await page.locator('#collection-cancel').click()
  assert errs==[], errs
  await page.screenshot(path='/mnt/data/oral-lab/preview-android.png',full_page=True)
  await page.set_viewport_size({'width':1400,'height':950})
  await page.screenshot(path='/mnt/data/oral-lab/preview-desktop.png',full_page=True)
  print(json.dumps({'result':'passed','preset_questions':6,'response_versions':3,'created_new_collection':True,'created_new_question':True,'edited':True,'persisted':True,'pdf_print_constructed':True,'console_errors':errs},ensure_ascii=False))
  await browser.close()
asyncio.run(main())
