import {
    Selector
} from 'testcafe';
import AsyncTestUtil from 'async-test-util';

fixture `Example page`
    .page `http://0.0.0.0:8888/`;


test('insert a hero', async t => {
    // input name
    const heroNameInput = Selector('.hero-insert-component input[name=name]');
    await t
        .expect(heroNameInput.value).eql('', 'input is empty')
        .typeText(heroNameInput, 'BobKelso')
        .expect(heroNameInput.value).contains('Kelso', 'input contains name');

    // input color
    const heroColorInput = Selector('.hero-insert-component input[name=color]');
    await t
        .expect(heroColorInput.value).eql('', 'input is empty')
        .typeText(heroColorInput, 'black')
        .expect(heroColorInput.value).contains('black', 'input contains color');

    // submit
    await t.click('.hero-insert-component button');
    await AsyncTestUtil.wait(200);

    const heroListElement = Selector('.hero-list-component .mat-list-item');
    await t.expect(heroListElement.textContent).contains('Kelso', 'list-item contains name');
});

test.page('http://0.0.0.0:8888/multitab.html?frames=2')('multitab: insert hero and check other tab', async t => {

    await t
        .switchToIframe('#frame_0')
        .typeText('.hero-insert-component input[name=name]', 'SteveIrwin')
        .typeText('.hero-insert-component input[name=color]', 'red')
        .click('.hero-insert-component button');

    await t.switchToMainWindow();

    // check if in other iframe
    await t.switchToIframe('#frame_1');
    await AsyncTestUtil.wait(100);
    const heroElements = Selector('.hero-list-component .mat-list-item');
    await t.expect(heroElements.count).eql(2);

    const heroListElement = Selector('.hero-list-component .mat-list-item:last-of-type');
    await t.expect(heroListElement.textContent).contains('Irwin', 'list-item contains name');
});

const tabsAmount = 4;
test.page('http://0.0.0.0:8888/multitab.html?frames=' + tabsAmount)('leader-election: Exact one tab should become leader', async t => {

    // wait until last tab loaded
    await t.switchToIframe('#frame_' + (tabsAmount - 1));
    await AsyncTestUtil.wait(1000);
    const heroNameInput = Selector('.hero-insert-component input[name=name]');
    await t.typeText(heroNameInput, 'foobar');
    await t.switchToMainWindow();

    // wait until at least one becomes leader
    let currentLeader = null;
    await AsyncTestUtil.waitUntil(async () => {
        let ret = false;
        for (let i = 0; i < tabsAmount; i++) {
            await t.switchToIframe('#frame_' + i);
            const title = await Selector('title').innerText;
            if (title.includes('♛')) {
                currentLeader = i;
                ret = true;
            }
            await t.switchToMainWindow();
        }
        return ret;
    });

    await AsyncTestUtil.wait(200); // w8 a bit
    // ensure still only one is leader
    let leaderAmount = 0;
    for (let i = 0; i < tabsAmount; i++) {
        await t.switchToIframe('#frame_' + i);
        const title = await Selector('title').innerText;
        if (title.includes('♛'))
            leaderAmount++;
        await t.switchToMainWindow();
    }
    if (leaderAmount !== 1)
        throw new Error('more than one tab is leader');



    //    console.log('leaderAmount: ' + leaderAmount);
    //    console.log('currentLeader: ' + currentLeader);

    // kill the leader
    await t
        .typeText('#removeId', currentLeader + '')
        .click('#submit');

    // wait until next one becomes leader
    await AsyncTestUtil.wait(200);
    const leaders = [];
    await AsyncTestUtil.waitUntil(async () => {
        let ret = false;
        for (let i = 0; i < tabsAmount; i++) {
            if (i !== currentLeader) {
                await t.switchToIframe('#frame_' + i);
                const title = await Selector('title').innerText;
                // console.log(title);
                if (title.includes('♛')) {
                    leaders.push(i);
                    ret = true;
                }
                await t.switchToMainWindow();
            }
        }
        return ret;
    });

    //    console.dir(leaders);

});
