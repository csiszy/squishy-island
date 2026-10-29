"""Tests for tools/check_boundaries.py.  Run: python3 -m unittest discover -s tools/tests"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import check_boundaries as cb  # noqa: E402

PROJECT = '[autoload]\n\nSave="*res://core/save/save_service.gd"\nAudio="*res://core/audio/audio_service.gd"\n\n[display]\n'


class BoundaryTest(unittest.TestCase):
    def game(self, files):
        d = tempfile.mkdtemp()
        files = dict(files)
        files.setdefault('project.godot', PROJECT)
        for rel, text in files.items():
            p = os.path.join(d, rel)
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, 'w', encoding='utf-8') as f:
                f.write(text)
        return cb.check(d)

    def test_a_sealed_minigame_passes(self):
        self.assertEqual(self.game({
            'minigame_api/minigame.gd': 'class_name Minigame\nextends Node\n',
            'minigame_kit/v1/hearts.gd': 'class_name HeartsHud\nextends Node\nvar m: Minigame\n',
            'minigames/sky_bounce/sky_bounce.gd': 'extends Minigame\nconst S = preload("res://minigames/sky_bounce/a.png")\nvar h: HeartsHud\n',
            'minigames/sky_bounce/sky_bounce.tscn': '[ext_resource type="Script" path="res://minigames/sky_bounce/sky_bounce.gd" id="1"]\n',
        }), [])

    def test_a_minigame_may_not_load_another_minigame(self):
        p = self.game({'minigames/a/a.gd': 'extends Node\nvar x = load("res://minigames/b/b.tscn")\n'})
        self.assertEqual(len(p), 1)
        self.assertIn('minigames/a/a.gd:2', p[0])

    def test_a_minigame_may_not_touch_coins_or_saves(self):
        p = self.game({
            'core/economy/economy.gd': 'class_name EconomyService\nextends Node\n',
            'minigames/a/a.gd': 'extends Node\nfunc f():\n\tSave.mark_dirty()\n\tvar e: EconomyService\n',
        })
        self.assertEqual(sorted(x.split(' may not use ')[1].split(' ')[0] for x in p), ['EconomyService', 'Save'])

    def test_words_in_strings_and_comments_do_not_count(self):
        self.assertEqual(self.game({'minigames/a/a.gd': 'extends Node\n# Save the day\nvar t = "Audio is fun"\n'}), [])

    def test_features_do_not_use_each_other(self):
        p = self.game({
            'features/city/city.gd': 'class_name CityMap\nextends Node\n',
            'features/factory/factory.gd': 'extends Node\nvar c: CityMap\nvar s = preload("res://features/city/city.tscn")\n',
        })
        self.assertEqual(len(p), 2)

    def test_only_the_host_loads_minigames(self):
        self.assertEqual(self.game({'features/minigame_host/host.gd': 'extends Node\nconst DIR = "res://minigames/"\n'}), [])
        self.assertEqual(len(self.game({'features/city/city.gd': 'extends Node\nconst DIR = "res://minigames/"\n'})), 1)

    def test_core_knows_nothing_about_features(self):
        p = self.game({'core/save/save.gd': 'extends Node\nvar x = "res://features/city/city.gd"\n'})
        self.assertEqual(len(p), 1)

    def test_the_contract_stands_alone(self):
        p = self.game({'minigame_api/context.gd': 'extends RefCounted\nfunc f():\n\tAudio.play(&"tap")\n'})
        self.assertEqual(len(p), 1)

    def test_the_real_game_passes(self):
        self.assertEqual(cb.check(), [])


if __name__ == '__main__':
    unittest.main()
