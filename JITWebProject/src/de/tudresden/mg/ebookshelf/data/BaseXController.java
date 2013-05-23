package de.tudresden.mg.ebookshelf.data;

import java.io.IOException;
import java.io.OutputStream;

import org.basex.BaseXServer;
import org.basex.core.cmd.CreateDB;
import org.basex.server.ClientSession;

public class BaseXController 
{
	private BaseXServer server = null;
	
	public boolean createServer(String pathToXMLData)
	{
		if(this.isRunning())
			return false;
		
		try {
			// start server on default port 1984
			server = new BaseXServer(); 
			
			// create session and initialize DB
		    ClientSession session = getSession();
		    
		    
		    session.execute(new CreateDB("input", pathToXMLData));
		    
		    
		    session.close();
		    return true;
		    
		} catch (IOException e) {
			System.out.println("Error while creating BaseX Server instance.");
			e.printStackTrace();
		} 
		
		return false;
	}
	
	/**
	 * Executes a query and prints the result to System.out.
	 * @param XQuery
	 * @throws IOException 
	 */
	public void executeQuery(String XQuery, boolean literally) throws IOException
	{
		this.executeQuery(XQuery, literally, System.out);
	}
	
	/**
	 * Executes a query and prints the result to the given output stream.
	 * @param XQuery
	 * @throws IOException 
	 */
	public void executeQuery(String XQuery, boolean literally, OutputStream out) throws IOException
	{
		ClientSession session = getSession();
		session.execute("OPEN input");
		session.setOutputStream(out);
		
		if(literally)
		{
			session.execute(XQuery);
		}
		else
		{
			session.execute("xquery doc('input')" + XQuery);
		}
		
		
		session.close();
	}
	
	/**
	 * Indicates whether the BaseX server instance is assigned.
	 * @return
	 */
	public boolean isRunning()
	{
		return this.server != null;
	}
	
	/**
	 * Creates a new client session for the default server instance.
	 * @return a new ClientSession object
	 */
	public ClientSession getSession()
	{
		try {
			return new ClientSession("localhost", 1984, "admin", "admin");
		} catch (IOException e) {
			System.out.println("Error while creating a BaseX session.");
			e.printStackTrace();
		}
		
		return null;
	}
	
}
