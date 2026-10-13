import assert from "node:assert/strict";
import test from "node:test";
import {
    matchesCmsBannerPlatform,
    matchesCmsHomeLayoutPlatform,
    matchesCmsPlatform,
} from "@/modules/cms/cms-platforms.js";

test("matchesCmsPlatform android requires explicit android flag", () => {
    assert.equal(matchesCmsPlatform(["mobile"], "android"), false);
    assert.equal(matchesCmsPlatform(["android"], "android"), true);
    assert.equal(matchesCmsPlatform(["web", "mobile", "android"], "android"), true);
    assert.equal(matchesCmsPlatform(["web"], "android"), false);
});

test("matchesCmsPlatform web unchanged", () => {
    assert.equal(matchesCmsPlatform(["web", "mobile"], "web"), true);
    assert.equal(matchesCmsPlatform(["android"], "web"), false);
});

test("matchesCmsBannerPlatform android excludes mobile-only rows", () => {
    assert.equal(matchesCmsBannerPlatform(["mobile"], "android"), false);
    assert.equal(matchesCmsBannerPlatform(["web", "mobile"], "android"), false);
    assert.equal(matchesCmsBannerPlatform(["android"], "android"), true);
    assert.equal(matchesCmsBannerPlatform(["web", "mobile"], "mobile"), true);
    assert.equal(matchesCmsBannerPlatform(["web", "mobile"], "web"), true);
});

test("matchesCmsHomeLayoutPlatform android excludes web mobile layout", () => {
    assert.equal(matchesCmsHomeLayoutPlatform(["mobile"], "android"), false);
    assert.equal(matchesCmsHomeLayoutPlatform(["web", "mobile"], "android"), false);
    assert.equal(matchesCmsHomeLayoutPlatform(["android"], "android"), true);
});
