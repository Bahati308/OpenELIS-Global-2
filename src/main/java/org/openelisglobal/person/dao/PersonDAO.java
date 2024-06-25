/**
 * The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the
 * License at http://www.mozilla.org/MPL/
 *
 * <p>Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF
 * ANY KIND, either express or implied. See the License for the specific language governing rights
 * and limitations under the License.
 *
 * <p>The Original Code is OpenELIS code.
 *
 * <p>Copyright (C) The Minnesota Department of Health. All Rights Reserved.
 */
package org.openelisglobal.person.dao;

import java.util.List;
import org.openelisglobal.common.dao.BaseDAO;
import org.openelisglobal.common.exception.LIMSRuntimeException;
import org.openelisglobal.person.valueholder.Person;

/**
 * @author diane benz
 *         <p>
 *         To change this generated comment edit the template variable
 *         "typecomment": Window>Preferences>Java>Templates. To enable and
 *         disable the creation of type comments go to
 *         Window>Preferences>Java>Code Generation.
 */
public interface PersonDAO extends BaseDAO<Person, String> {

    // public boolean insertData(Person person) throws LIMSRuntimeException;

    // public void deleteData(List persons) throws LIMSRuntimeException;

    List<Person> getAllPersons() throws LIMSRuntimeException;

    List<Person> getPageOfPersons(int startingRecNo) throws LIMSRuntimeException;

    void getData(Person person) throws LIMSRuntimeException;

    // public void updateData(Person person) throws LIMSRuntimeException;

    Person getPersonByLastName(String lastName) throws LIMSRuntimeException;

    Person getPersonById(String personId) throws LIMSRuntimeException;
}
