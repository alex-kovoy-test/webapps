/**
 * Copyright 2020 Gravitational, Inc.
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

import React, { KeyboardEvent } from 'react';
import TextSelectCopy from 'teleport/components/TextSelectCopy';
import {
  Link,
  Text,
  Flex,
  Alert,
  ButtonSecondary,
  ButtonPrimary,
} from 'design';
import Validation, { Validator } from 'shared/components/Validation';
import FieldInput from 'shared/components/FieldInput';
import { DialogContent, DialogFooter } from 'design/Dialog';
import { Attempt } from 'shared/hooks/useAttemptNext';

export default function Automatically(props: Props) {
  const { cmd, onClose, attempt, expires } = props;

  const [name, setName] = React.useState('');
  const [uri, setUri] = React.useState('');

  function handleCreate(validator: Validator) {
    if (!validator.validate()) {
      return;
    }

    props.onCreate(name, uri);
  }

  function handleEnterPress(
    e: KeyboardEvent<HTMLInputElement>,
    validator: Validator
  ) {
    if (e.key === 'Enter') {
      handleCreate(validator);
    }
  }

  return (
    <Validation>
      {({ validator }) => (
        <>
          <DialogContent minHeight="254px" flex="0 0 auto">
            <Flex alignItems="center" flexDirection="row">
              <FieldInput
                rule={requiredAppName}
                label="App Name"
                autoFocus
                value={name}
                placeholder="jenkins"
                width="320px"
                mr="3"
                onKeyPress={e => handleEnterPress(e, validator)}
                onChange={e => setName(e.target.value.toLowerCase())}
              />
              <FieldInput
                rule={requiredAppUri}
                label="INTERNAL APPLICATION URL"
                width="100%"
                value={uri}
                placeholder="https://localhost:4000"
                onKeyPress={e => handleEnterPress(e, validator)}
                onChange={e => setUri(e.target.value)}
              />
            </Flex>
            {!cmd && (
              <Text mb="3">
                Teleport can automatically set up application access. Provide
                the name and URL of your application to generate our
                auto-installer script.
                <Text mt="2">
                  The script will install the Teleport agent to provide secure
                  access to your application.
                </Text>
              </Text>
            )}
            {attempt.status === 'failed' && (
              <Alert kind="danger" children={attempt.statusText} />
            )}
            {cmd && (
              <>
                <Text mb="3">
                  Use the script below to add an application to your cluster.{' '}
                  The script will be valid for
                  <Text bold as="span">
                    {` ${expires}`}.
                  </Text>
                  {renderUrl(name)}
                </Text>
                <TextSelectCopy text={cmd} mb={2} />
              </>
            )}
          </DialogContent>
          <DialogFooter>
            {!cmd && (
              <ButtonPrimary
                mr="3"
                disabled={attempt.status === 'processing'}
                onClick={() => handleCreate(validator)}
              >
                Generate Script
              </ButtonPrimary>
            )}
            {cmd && (
              <ButtonPrimary
                mr="3"
                disabled={attempt.status === 'processing'}
                onClick={() => handleCreate(validator)}
              >
                Regenerate
              </ButtonPrimary>
            )}
            <ButtonSecondary
              disabled={attempt.status === 'processing'}
              onClick={onClose}
            >
              Close
            </ButtonSecondary>
          </DialogFooter>
        </>
      )}
    </Validation>
  );
}

function renderUrl(name = '') {
  const url = `https://${name}.${window.location.host}`;
  return (
    <Text>
      This app will be available on {`  `}
      <Link target="_blank" href={url}>
        {`${url}`}
      </Link>
    </Text>
  );
}

// Validation logic matches backend checks for app URI
const ALLOWED_APPURI_REGEXP = /^[-\w/:. ]+$/;
const requiredAppUri = value => () => {
  if (!value) {
    return {
      valid: false,
      message: 'Required',
    };
  }

  try {
    new URL(value);
  } catch {
    return {
      valid: false,
      message: 'URL is invalid',
    };
  }

  const appUriMatch = value.match(ALLOWED_APPURI_REGEXP);
  if (!appUriMatch) {
    return {
      valid: false,
      message: 'Invalid app URI',
    };
  }

  return {
    valid: true,
  };
};

/**
 * Conforms to rfc 1035 name syntax where:
 * - name should start with alphabets and end with alphanumerics
 * - interior characters are only alphanumerics and hyphens
 * - string must be 63 chars or less
 */
const REGEX_DNS1035LABEL = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
const DNS1035LABEL_MAXLENGTH = 63;
const requiredAppName = value => () => {
  if (!value || value.length === 0) {
    return {
      valid: false,
      message: 'Required',
    };
  }

  if (value.length > DNS1035LABEL_MAXLENGTH) {
    return {
      valid: false,
      message: 'Must be 63 chars or less',
    };
  }

  const match = value.match(REGEX_DNS1035LABEL);
  if (!match) {
    return {
      valid: false,
      message: 'Invalid DNS sub-domain name',
    };
  }

  return {
    valid: true,
  };
};

type Props = {
  onClose(): void;
  onCreate(name: string, uri: string): Promise<any>;
  cmd: string;
  expires: string;
  attempt: Attempt;
};
