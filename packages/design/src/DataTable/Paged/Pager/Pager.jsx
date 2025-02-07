/*
Copyright 2019 Gravitational, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import styled from 'styled-components';
import Icon, { CircleArrowLeft, CircleArrowRight } from 'design/Icon';
import { Text, Flex } from 'design';
import PropTypes from 'prop-types';

export default function Pager(props) {
  const {
    startFrom = 0,
    endAt = 0,
    totalRows = 0,
    onPrev,
    onNext,
    onFetch,
    fetchStatus = 'disabled',
  } = props;
  const isPrevDisabled = totalRows === 0 || startFrom === 0;
  const isNextDisabled = totalRows === 0 || endAt === totalRows;
  const initialStartFrom = totalRows > 0 ? startFrom + 1 : 0;
  const isFetchEnabled = fetchStatus !== 'disabled';
  const isFetching = fetchStatus === 'loading';

  return (
    <Flex>
      <Flex alignItems="center" mr={2}>
        <Text typography="body2" color="primary.contrastText">
          SHOWING <strong>{initialStartFrom}</strong> - <strong>{endAt}</strong>{' '}
          of <strong>{totalRows}</strong>
        </Text>
        {isFetchEnabled && (
          <StyledButtonLink onClick={onFetch} disabled={isFetching}>
            Fetch More
          </StyledButtonLink>
        )}
      </Flex>
      <StyledButtons>
        <button
          onClick={onPrev}
          title="Previous Page"
          disabled={isPrevDisabled}
        >
          <CircleArrowLeft fontSize="3" />
        </button>
        <button onClick={onNext} title="Next Page" disabled={isNextDisabled}>
          <CircleArrowRight fontSize="3" />
        </button>
      </StyledButtons>
    </Flex>
  );
}

Pager.propTypes = {
  startFrom: PropTypes.number.isRequired,
  endAt: PropTypes.number.isRequired,
  totalRows: PropTypes.number.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};

export const StyledButtons = styled(Flex)`
  button {
    background: none;
    border: none;
    border-radius: 200px;
    cursor: pointer;
    padding: 0;
    margin: 0 0 0 8px;
    outline: none;
    transition: all 0.3s;
    text-align: center;

    &:hover,
    &:focus {
      background: ${props => props.theme.colors.primary.main};

      ${Icon} {
        opacity: 1;
      }
    }

    ${Icon} {
      opacity: 0.4;
      font-size: 20px;
      transition: all 0.3s;
    }
  }
`;

const StyledButtonLink = styled.button`
  color: ${props => props.theme.colors.link};
  background: none;
  text-decoration: underline;
  text-transform: none;
  padding-left: 8px;
  outline: none;
  border: none;
  font-weight: bold;
  line-height: 0;
  font-size: 12px;

  &:hover,
  &:focus {
    cursor: pointer;
  }

  &:disabled {
    color: ${props => props.theme.colors.action.disabled};
    cursor: wait;
  }
`;
