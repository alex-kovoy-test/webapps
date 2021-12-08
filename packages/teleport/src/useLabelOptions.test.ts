/**
 * Copyright 2021 Gravitational, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import renderHook, { act } from 'design/utils/renderHook';
import { Label, makeLabelTag } from 'teleport/services/resources';
import useLabelOptions, { Data, State } from './useLabelOptions';

test('correct formatting of options from list of data and labels', () => {
  let result;
  act(() => {
    result = renderHook(() => useLabelOptions(data, [label1, label2]));
  });

  let options: State = result.current;

  expect(options.all).toHaveLength(2);
  expect(options.selected).toHaveLength(2);

  // Test sort and format of a option.
  expect(options.all[0].value).toEqual(makeLabelTag(label2));
  expect(options.all[0].label).toEqual(makeLabelTag(label2));
  expect(options.all[0].obj).toMatchObject(label2);

  // Test format of a selected option.
  expect(options.selected[0].value).toEqual(makeLabelTag(label1));
  expect(options.selected[0].label).toEqual(makeLabelTag(label1));
  expect(options.selected[0].obj).toMatchObject(label1);
});

test('toggling options', () => {
  let result;
  act(() => {
    result = renderHook(() => useLabelOptions(data, [label1, label2]));
  });

  let options: State = result.current;

  // Test toggling of an existing option (delete).
  let selected = options.getUpdatedSelections(label1);
  expect(selected).toHaveLength(1);
  expect(selected[0].obj).toMatchObject(label2);

  // Test toggling of a a new option (add).
  const newLabel = { name: 'key', value: 'value' };
  selected = options.getUpdatedSelections(newLabel);
  expect(selected).toHaveLength(3);
  expect(selected[2].obj).toMatchObject(newLabel);
});

const label1: Label = { name: 'key1', value: 'value1' };
const label2: Label = { name: 'country', value: 'South Korea' };
const data: Data[] = [
  {
    tags: [label1].map(makeLabelTag),
    labels: [label1],
  },
  {
    tags: [label1, label2].map(makeLabelTag),
    labels: [label1, label2],
  },
];
