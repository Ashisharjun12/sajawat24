import assert from "node:assert/strict";
import test from "node:test";
import { matchesCmsHomeLayoutPlatform, matchesCmsPlatform } from "@/modules/cms/cms-platforms.js";

test("matchesCmsPlatform android includes legacy mobile", () => {
    assert.equal(matchesCmsPlatform(["mobile"], "android"), true);
    assert.equal(matchesCmsPlatform(["android"], "android"), true);
    assert.equal(matchesCmsPlatform(["web"], "android"), false);
});

test("matchesCmsPlatform web unchanged", () => {
    assert.equal(matchesCmsPlatform(["web", "mobile"], "web"), true);
    assert.equal(matchesCmsPlatform(["android"], "web"), false);
});

test("matchesCmsHomeLayoutPlatform android excludes web mobile layout", () => {
    assert.equal(matchesCmsHomeLayoutPlatform(["mobile"], "android"), false);
    assert.equal(matchesCmsHomeLayoutPlatform(["web", "mobile"], "android"), false);
    assert.equal(matchesCmsHomeLayoutPlatform(["android"], "android"), true);
});
