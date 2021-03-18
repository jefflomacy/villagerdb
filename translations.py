#!/usr/bin/env python3
import argparse
import json
import os
import sys

import requests

TRANS_URL = "https://raw.githubusercontent.com/Stun3R/acnh-translations-sheet-to-json/master/out/all.json"
DIR_PATH = os.path.dirname(os.path.realpath(__file__))


def get_item_key(key):
    key = (key.strip().lower().replace(" ", "-").replace(".", "").replace(
        "'", "").replace("á", "a").replace("à", "a").replace("é", "e").replace(
            "í",
            "i").replace("&", "").replace("/", "").replace("--", "-").replace(
                "ñ", "n").replace("(",
                                  "").replace(")",
                                              "").replace("?", "question"))
    return key


def transform_case(name):
    new_name = []
    upper_whitelist = [
        'HHA', 'TV', 'MVP', 'DAL', 'DIY', 'DJ', 'KK', 'OK', 'LCD', 'ACNH',
        'HMD', 'PJ'
    ]
    for word in name.split(" "):
        if word.upper() in upper_whitelist:
            # Words that are always upper case.
            new_name.append(word.upper())
        elif (not word.isupper()):
            # If neither in the whitelist or already uppercase, transform to title case.
            new_name.append(word.title())
        else:
            # Otherwhise do not modify this word.
            new_name.append(word)
    name = " ".join(new_name)

    # Remove title case after ' character.
    commas = [pos for pos, char in enumerate(name) if char == "'"]
    for comma in commas:
        if len(name) - 1 > comma:
            segment1 = name[:comma + 1]
            segment2 = name[comma + 1].lower()
            segment3 = name[comma + 2:]
            name = segment1 + segment2 + segment3

    return name


def transform_lan(lan):
    # Transform languages tags to match with IETF.
    languages = {
        'de_DE': 'de',
        'en_GB': 'en-GB',
        'en_US': 'en-US',
        'es_ES': 'es-ES',
        'es_US': 'es-419',
        'fr_CA': 'fr-CA',
        'fr_FR': 'fr-FR',
        'it_IT': 'it',
        'ja_JP': 'ja',
        'ko_KR': 'ko',
        'nl_NL': 'nl',
        'ru_RU': 'ru',
        'zh_CN': 'zh-CN',
        'zh_TW': 'zh-TW',
    }
    return languages[lan]


def change_localization(item):
    localization = {}
    for lan in item['localization']:
        localization[transform_lan(lan)] = item['localization'][lan]
    item['localization'] = localization
    return item


def stats():

    translations_by_key = {}
    translations_by_name = {}
    response = requests.get(TRANS_URL).json()

    for item in response:
        key = get_item_key(item['ref'])
        name = transform_case(item['ref'])
        translations_by_key[key] = item
        translations_by_name[name] = item

    items = os.listdir(os.path.join(DIR_PATH, 'data', 'items'))

    total = 0
    count = 0
    auto_fixable_missmatch = []
    no_translation = []
    name_missmatches = []
    key_missmatches = []
    for item_name in items:
        item_dir = os.path.join(DIR_PATH, 'data', 'items', item_name)
        with open(item_dir, 'r') as item_json:
            item = json.load(item_json)
            if 'nh' in item['games']:
                total += 1
                if item['id'] in translations_by_key:
                    if item['name'] in translations_by_name:
                        count += 1
                    elif transform_case(item['name']) in translations_by_name:
                        auto_fixable_missmatch.append(
                            f'{item["name"]} -> {transform_case(item["name"])}'
                        )
                    else:
                        name = transform_case(
                            translations_by_key[item['id']]['ref'])
                        name_missmatches.append(f'{item["name"]} | {name}')
                elif item['name'] in translations_by_name:
                    key_missmatches.append(item_name)
                else:
                    no_translation.append(item_name)

    print('------------------------------------------------------------')
    print(f'{count}/{total} nh matches')
    if no_translation:
        print('------------------------------------------------------------')
        print(f"{len(no_translation)} items couldn't be found")
        out = os.path.join(DIR_PATH, 'no_translations.log')
        with open(out, 'w+') as f:
            f.write('\n'.join(no_translation))
        print(f'Check them in {out}')
    if key_missmatches:
        print('------------------------------------------------------------')
        print(f"{len(key_missmatches)} items match the name, but not the key")
        out = os.path.join(DIR_PATH, 'key_missmatches.log')
        with open(out, 'w+') as f:
            f.write('\n'.join(key_missmatches))
        print(f'Check them in {out}')
    if name_missmatches:
        print('------------------------------------------------------------')
        print(
            f"{len(name_missmatches)} items has non auto-fixable name missmatch"
        )
        out = os.path.join(DIR_PATH, 'name_missmatches.log')
        with open(out, 'w+') as f:
            f.write('\n'.join(name_missmatches))
        print(f'Check them in {out}')
    if auto_fixable_missmatch:
        print('------------------------------------------------------------')
        print(f'{len(auto_fixable_missmatch)} auto fixable missmatches.')
        out = os.path.join(DIR_PATH, 'autofixable.log')
        with open(out, 'w+') as f:
            f.write('\n'.join(auto_fixable_missmatch))
        print(f'Check them in {out}')
        print(f'Run "python translations fix-cases" to auto fix them')
    print('------------------------------------------------------------')


def fix_cases(dry, game):
    items = os.listdir(os.path.join(DIR_PATH, 'data', 'items'))
    transform_list = []
    for item_name in items:
        item_dir = os.path.join(DIR_PATH, 'data', 'items', item_name)
        with open(item_dir, 'r') as item_json:
            item = json.load(item_json)
            if item['name'] != transform_case(item['name']):
                if game == 'All' or game in item['games']:
                    transform_list.append(
                        f'{item["name"]} -> {transform_case(item["name"])}')
                    item['name'] = transform_case(item['name'])

                    if not dry:
                        with open(item_dir, 'w+') as item_json:
                            json.dump(item,
                                      item_json,
                                      indent=2,
                                      ensure_ascii=False)

    out = os.path.join(DIR_PATH, 'fix_cases.log')
    with open(out, 'w+') as f:
        f.write('\n'.join(transform_list))
    if dry:
        verb = 'will change'
    else:
        verb = 'changed'
    print(f'{len(transform_list)} items {verb}. Check {out}')


def update_translations():

    localization_items = requests.get(TRANS_URL).json()
    translations_by_key = {}
    translations_by_name = {}

    for item in localization_items:
        item = change_localization(item)
        if 'variants' in item:
            for variant in item['variants']:
                variant = change_localization(variant)

        key = get_item_key(item['ref'])
        name = transform_case(item['ref'])
        translations_by_key[key] = item
        translations_by_name[name] = item

    items = os.listdir(os.path.join(DIR_PATH, 'data', 'items'))

    for item_name in items:
        item_dir = os.path.join(DIR_PATH, 'data', 'items', item_name)
        with open(item_dir, 'r') as item_json:
            item = json.load(item_json)
            if ('nh' in item['games'] and item['id'] in translations_by_key
                    and item['name'] in translations_by_name):
                trans_item = translations_by_key[item['id']]
                item['games']['nh']['name'] = trans_item['localization']
                if ('variations' in item['games']['nh']
                        and 'variants' in trans_item
                        and len(trans_item['variants']) > 0):
                    variations = item['games']['nh']['variations']
                    trans_variants = [v['ref'] for v in trans_item['variants']]
                    for variation in item['games']['nh']['variations']:
                        try:
                            index = trans_variants.index(variations[variation])
                            variation = trans_item['variants'][index][
                                'localization']
                        except:
                            if '/' not in variations[variation]:
                                print(
                                    f'{item["id"]} | {variations[variation]}')

        if not dry:
            with open(item_dir, 'w+') as item_json:
                json.dump(item, item_json, indent=2, ensure_ascii=False)


def usage():
    print(
        "translations.py - Use one of this arguments:\n"
        "\tstats: print and log some stats about the operations (missmatches, cases, etc).\n"
        "\tfix-cases: auto-fix cases problems.\n"
        "\t\tUse --dry or -d for a dry run, without modifications.\n"
        "\t\tUse --game or -g followed to one game to auto-fix only names for that game.\n"
        "\tupdate-translations: update items with localization strings for each language.\n"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Use one of this commands:\n"
        "\tstats: print and log some stats about the operations (missmatches, cases, etc).\n"
        "\tfix-cases: auto-fix cases problems.\n"
        "\t\tUse --dry or -d for a dry run, without modifications.\n"
        "\t\tUse --game or -g followed to one game to auto-fix only names for that game.\n"
        "\tupdate-translations: update items with localization strings for each language.\n"
    )
    parser.add_argument('command',
                        metavar='command',
                        type=str,
                        help='stats, fix-cases or update-translations.')
    parser.add_argument(
        '--dry',
        '-d',
        action='store_true',
        help='Only used for fix-cases. Do NOT any modification.')
    parser.add_argument(
        '--game',
        '-g',
        default='All',
        help=
        'Only used for fix-cases. If given, only items in the target game are changed.'
    )

    args = parser.parse_args()

    dry = args.dry
    game = args.game

    if args.command == 'fix-cases':
        fix_cases(dry, game)
    elif args.command == 'stats':
        stats()
    elif args.command == 'update-translations':
        update_translations()
